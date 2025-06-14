import { uniqBy } from "lodash";
import { SemVer } from "semver";
import { Cell } from "./Cell";
import { Runtime } from "./Runtime";
import { Variable } from "./Variable";
import { randomString } from "./x";

const LOG = false;

// ModuleNameVersion is a string that represents a module name and version
// e.g. "module@1" or "module@1.0" or "module@1.0.0"
export type ModuleNameVersion = string;
export type ModuleVariableId = string; // `${moduleId}/${variableId}`;
export type ModuleVariableName = string; // `${moduleId}:${variableName}`;

// Module represents a collection of variablesById
export class Module {
  runtime: Runtime;

  // global unique id of the module, auto generated at the runtime
  id: string;
  // name of the module
  name: string;
  // version of the module
  version: SemVer;

  // variablesById: Map<ModuleVariableId, Variable> = new Map();
  //
  // variablesByName: Map<ModuleVariableName, Variable[]> = new Map();

  // create a new module with the given runtime, id, name and version
  static create(runtime: Runtime, id: string, name: string, version: string) {
    return new Module(runtime, id, name, version);
  }

  private constructor(runtime: Runtime, uid: string, name: string, version: string) {
    this.runtime = runtime;
    this.id = uid;
    this.name = name;
    this.version = new SemVer(version);
  }

  get uid() {
    return `${this.name}@${this.version.toString()}-${this.id}`;
  }

  get graph() {
    return this.runtime.graph;
  }

  get variablesById() {
    return this.runtime.variablesById;
  }

  get variablesByName() {
    return this.runtime.variablesByName;
  }

  // get variables() {
  //   return this.variablesById;
  // }
  //
  // get moduleVariables() {
  //   return this.variablesByName;
  // }

  // play the variable with the given name
  recompute(name: string) {
    const variables = this.variablesByName.get(name);

    variables?.forEach((v) => {
      this.runtime.markDirty(v);
    });

    this.runtime.schedule();
  }

  private value(name: string): Variable | undefined {
    const fullName = Variable.fullName(this.id, name);
    const variables = this.variablesByName.get(fullName);
    if (!variables) return;

    if (variables.length > 1) {
      console.error("multiple variablesById with the same name", name);
      return;
    }

    return variables[0];
  }

  // compute the variable with the given id
  compute(id: string) {
    const vid = Variable.id(this.id, id);
    const variable = this.variablesById.get(vid);
    if (!variable) {
      console.error("variable not found", id);
      return;
    }

    this.runtime.markDirty(variable);
    this.runtime.schedule();
  }

  // variable by id, optionally return a mutable variable
  variable(id: string): Variable | undefined {
    return this.variablesById.get(Variable.id(this.id, id));
  }

  derive(
    id: string,
    name: string,
    injects: (string | { name: string; alias: string })[],
    fromModule: Module,
  ) {
    const mod = Module.create(this.runtime, id, name, fromModule.version.toString());
    injects.forEach((inject) => {
      if (typeof inject === "string") {
        mod.import(inject, inject, fromModule);
      } else {
        mod.import(inject.name, inject.alias, fromModule);
      }
    });

    return mod;
  }

  // import a variable from another module
  // multiple imports can be done by calling this function multiple times
  import(name: string, alias: string, module: Module, schedule = true, dirty = true) {
    // check if the variable exists in the module
    const from = module.value(name);
    if (!from) {
      console.error("variable not found", name);
      return;
    }

    const cell = Cell.create({
      id: `import(${module.id}/${randomString(10)})`,
      name: alias,
      code: `(x) => x`,
      // fully qualified name of the variable in the module
      dependencies: [Variable.fullName(module.id, name)],
      definition: (x) => x,
      builtin: from?.builtin,
    });

    const variable = Variable.create({
      module: this,
      cell,
    });

    this.onCreate(variable, dirty);

    if (schedule) {
      this.runtime.schedule();
    }

    return variable;
  }

  private findBuiltIn(cell: Cell) {
    // check if the cell is a builtin variable
    const fullName = Variable.fullName(this.id, cell.name);
    const moduleVariables = this.variablesByName.get(fullName);
    if (moduleVariables?.length == 1 && moduleVariables[0].builtin) {
      console.error("builtin variable already exists", fullName);
      return moduleVariables[0];
    }

    return null;
  }

  // create a new variable with the given definition
  // if the variable already exists, redefine it
  define(cell: Cell, schedule = true, dirty = true): Variable {
    // if (!cell.builtin && cell.name !== "c") return;

    const builtIn = this.findBuiltIn(cell);
    if (builtIn) {
      this.onRemove(builtIn);
    }

    const before = this.variablesById.get(Variable.id(this.id, cell.id));
    // if the variable with same id already exists
    // redefine: delete and create a new variable
    if (before) {
      return this.redefine(cell);
    }

    // create a new variable with the given definition
    const variable = Variable.create({
      module: this,
      cell,
    });

    this.onCreate(variable, dirty);

    if (schedule) {
      this.runtime.schedule();
    }

    return variable;
  }

  // redefine a variable with the given definition
  // optionally change the name, inputs, or definition
  private redefine(cell: Cell): Variable {
    console.log("redefine", cell.id, cell.name, cell.dependencies);
    const builtIn = this.findBuiltIn(cell);
    if (builtIn) {
      this.onRemove(builtIn);
    }

    const fullId = Variable.id(this.id, cell.id);
    const before = this.variablesById.get(fullId);
    // if the variable does not exist, create a new one
    if (!before) {
      throw new Error(`Variable with id ${cell.id} does not exist in module ${this.id}`);
    }

    // if the cell has not changed, we just need to play
    if (before.cell.eq(cell)) {
      console.log("redefine", cell.id, cell.name, "no change");
      before.cell.version += 1;
      this.runtime.markDirty(before);
      this.runtime.schedule();
      return before;
    }

    // remove the old variable from existing graph
    this.onRemove(before, false);

    cell.version = before.version + 1;
    const after = Variable.create({
      module: this,
      cell,
    });

    this.onCreate(after);

    this.runtime.schedule();

    return after;
  }

  // delete a variable by id
  delete(id: string) {
    const fullId = Variable.id(this.id, id);
    const variable = this.variablesById.get(fullId);
    if (!variable) {
      console.warn("variable not found", fullId);
      return;
    }

    if (variable) {
      this.onRemove(variable);
    }
  }

  onCreate(variable: Variable, dirty = true) {
    // for built-in variables, skip auto-injection of built-in dependencies
    if (!variable.cell.builtin) {
      const missingDeps = variable.cell.dependencies.filter((v) => {
        return !this.variablesByName.get(v)?.length;
      });
      // define built-in variables if they are missing
      if (missingDeps.length > 0) {
        const builtinCells = missingDeps
          .map((dep) => this.runtime.builtinCells.get(Variable.visibleName(dep))!)
          .filter(Boolean);
        builtinCells.forEach((cell) => {
          const variable = Variable.create({
            module: this,
            cell,
          });

          this.onCreate(variable, dirty);
        });
      }
    }

    this.connect(variable);

    this.runtime.onCreate(variable);

    // connect the variable with the module local variablesById
    this.variablesById.set(variable.id, variable);
    this.variablesByName.set(variable.name, this.variablesByName.get(variable.name) || []);
    this.variablesByName.get(variable.name)!.push(variable);

    if (dirty) {
      this.variablesByName.get(variable.name)?.forEach((v) => {
        this.runtime.markDirty(v);
      });
    }
  }

  // connect the variable with the module local variablesById
  // imports from other modules are done explicitly using import function
  // NOTE: must be called before onCreate
  private connect(variable: Variable) {
    variable.inputs = variable.dependencies
      .map((name) => this.variablesByName.get(name))
      .filter(Boolean)
      .flat() as Variable[];

    variable.inputs.forEach((input) => {
      input.outputs.push(variable);
      input.outputs = uniqBy(input.outputs, "id");
    });

    this.variablesById.forEach((v) => {
      if (v.id === variable.id) return;
      if (v.dependencies.includes(variable.name)) {
        v.inputs.push(variable);
        v.inputs = uniqBy(v.inputs, "id");

        // connect the output
        variable.outputs.push(v);
        variable.outputs = uniqBy(variable.outputs, "id");
      }
    });
  }

  onRemove(variable: Variable, injectBuiltIn = true) {
    if (variable.state.isDetached) return;
    variable.stop();
    variable.detach();

    this.runtime.onRemove(variable);

    // remove the variable from the module local variablesById
    this.variablesById.delete(variable.id);

    // remove the variable from the module local variablesByName
    const variables = this.variablesByName.get(variable.name);
    if (variables) {
      const newVariables = variables.filter((v) => v.id !== variable.id);
      this.variablesByName.set(variable.name, newVariables);
      newVariables.forEach((c) => this.runtime.markDirty(c));
    }

    variable.outputs.forEach((output) => {
      this.runtime.markDirty(output);
    });

    variable.inputs.forEach((input) => {
      // if (input.state.isPending) {
      //   this.runtime.markDirty(input);
      // }
    });

    this.disconnect(variable);

    variable.delete({ module: true });

    if (!injectBuiltIn) return;

    const missingDeps = new Set<string>();
    // auto-inject missing dependencies from built-in variables
    this.variablesById.forEach((v) => {
      if (v.module !== this) return;
      v.cell.dependencies.forEach((dep) => {
        missingDeps.add(dep);
      });
    });

    missingDeps.forEach((dep) => {
      // check if the dependency is already defined in the module
      if (dep != variable.name || this.variablesByName.get(dep)?.length) return;
      console.log("xxxxxxxxxx", dep, variable.name, variable.id);

      const builtIn = this.runtime.builtinCells.get(Variable.visibleName(dep));
      if (builtIn) {
        const builtInVariable = Variable.create({
          module: this,
          cell: builtIn,
        });

        this.onCreate(builtInVariable, false);
      }
    });
  }

  private disconnect(variable: Variable) {
    variable.inputs.forEach((input) => {
      input.outputs = input.outputs.filter((o) => o.id !== variable.id);
    });

    variable.outputs.forEach((output) => {
      output.inputs = output.inputs.filter((i) => i.id !== variable.id);
    });

    variable.inputs = [];
    variable.outputs = [];
  }
}
