import { uniqBy } from "lodash";
import { SemVer } from "semver";
import { Cell } from "./Cell";
import { Mutable } from "./Mutable";
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

  variablesById: Map<ModuleVariableId, Variable> = new Map();

  variablesByName: Map<ModuleVariableName, Variable[]> = new Map();

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

  get variables() {
    return this.variablesById;
  }

  get moduleVariables() {
    return this.variablesByName;
  }

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

  // builtin variable by name
  builtin(name: string) {
    return this.runtime.builtinVariables.get(name);
  }

  // variable by id, optionally return a mutable variable
  variable(id: string, mutable?: boolean): Variable | undefined {
    if (mutable) {
      const mutableId = Mutable.mutableId(id);
      return this.variablesById.get(Variable.id(this.id, mutableId));
    }

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
    const variable = module.value(name);
    if (!variable) {
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
      builtin: variable?.builtin,
    });

    return this.define(cell, schedule, dirty);
  }

  // define a mutable variable with the given name and value
  defineMutable(cell: Cell): Variable {
    console.log("--------------------------------------------");
    const { name } = cell;

    const hiddenId = Mutable.hiddenId(cell.id);
    const hiddenName = Mutable.hiddenName(name);
    const mutableId = Mutable.mutableId(cell.id);
    const mutableName = Mutable.mutableName(name);
    const moduleVariableName = Variable.fullName(this.id, name);

    const mut = this.runtime.mutable;
    const variable = this.variablesById.get(Variable.id(this.id, cell.id));
    // remove the variable if it already exists
    if (variable) {
      if (variable.cell.immutable) {
        mut.delete(moduleVariableName);
        this.delete(mutableId);
        this.delete(hiddenId);
        this.delete(cell.id);
        cell.version = variable.version + 1;
      } else {
        this.delete(cell.id);
      }
    }

    // module local id for the mutable variable

    const dependents: string[] = [moduleVariableName];

    // update the cell with the module id and name
    cell.with(this);

    const hidden = this.define(
      Cell.create({
        id: hiddenId,
        name: hiddenName,
        dependencies: cell.dependencies,
        version: cell.version,
        definition: (...args: any) => {
          const value = cell.definition(...args);
          // define a mutable variable with the given name and value
          console.log("###", moduleVariableName, value);
          mut.define(moduleVariableName, value, dependents);

          return value;
        },
      }),
      false,
    );

    // define the mutable part of the mutable variable
    const mutable = this.define(
      Cell.create({
        id: mutableId,
        name: mutableName,
        version: cell.version,
        dependencies: [hiddenName],
        definition: function () {
          return mut.accessor<any>(moduleVariableName);
        },
      }),
      false,
    );

    // define the immutable part of the mutable variable
    // when the mutable variable is changed, the immutable part will be recomputed
    const immutable = this.define(
      Cell.create({
        id: cell.id,
        name: cell.name,
        version: cell.version,
        dependencies: [hiddenName],
        immutable: true,
        definition: () => {
          return mut.accessor<any>(moduleVariableName).value;
        },
      }),
      false,
    );

    this.onCreate(hidden);
    this.onCreate(mutable);
    this.onCreate(immutable);
    this.connect(hidden);
    this.connect(mutable);
    this.connect(immutable);

    // finally schedule the runtime to play the dirty variables
    this.runtime.schedule();

    return immutable;
  }

  defineView(cell: Cell): Variable {
    // create a view variable that is derived from the given cell
    // the view variable will be recomputed when the cell is changed
    const fullId = Variable.id(this.id, cell.id);
    const variable = this.variablesById.get(fullId);

    const mut = this.runtime.mutable;
    const hiddenName = Mutable.hiddenName(cell.name);
    const viewVariableId = Mutable.visibleId(cell.id);
    const moduleVariableName = Variable.fullName(this.id, cell.name);

    if (variable) {
      mut.delete(moduleVariableName);
      this.delete(cell.id);
      this.delete(viewVariableId);
    }

    console.log(cell);

    // inject the module id and name into the cell
    // cell.with(this);

    mut.define(moduleVariableName, "", [moduleVariableName]);

    // define the hidden part of the view variable
    const viewVariable = this.define(
      Cell.create({
        id: cell.id,
        name: hiddenName,
        dependencies: cell.dependencies,
        version: cell.version,
        definition: (...args: any) => {
          const el = cell.definition(...args);
          const accessor = mut.accessor(moduleVariableName);
          el.oninput = (e: any) => {
            console.log("input", e.target.value);
            mut.accessor(moduleVariableName).value = e.target.value;
          };

          accessor.value = el.value;

          return el;
        },
      }),
      false,
    );

    const immutableVariable = this.define(
      Cell.create({
        id: viewVariableId,
        name: cell.name,
        version: cell.version,
        dependencies: [hiddenName],
        immutable: true,
        definition: function (hidden) {
          console.log("hidden", hidden);
          // debugger;
          return mut.accessor(moduleVariableName).value;
        },
      }),
      false,
    );

    this.onCreate(viewVariable);
    this.connect(viewVariable);
    this.onCreate(immutableVariable);
    this.connect(immutableVariable);

    console.log(immutableVariable, viewVariable);

    this.runtime.schedule();

    return viewVariable;
  }

  private findBuiltIn(cell: Cell) {
    // check if the cell is a builtin variable
    if (cell.builtin) {
      const fullName = Variable.fullName(this.id, cell.name);
      const moduleVariables = this.variablesByName.get(fullName);
      if (moduleVariables?.length) {
        console.error("builtin variable already exists", fullName);
        return moduleVariables[0];
      }
    }

    return null;
  }

  // create a new variable with the given definition
  // if the variable already exists, redefine it
  define(cell: Cell, schedule = true, dirty = true): Variable {
    // if (!cell.builtin && cell.name !== "c") return;

    const builtIn = this.findBuiltIn(cell);
    if (builtIn) {
      return builtIn;
    }

    if (cell.mutable) {
      return this.defineMutable(cell);
    }

    if (cell.view) {
      return this.defineView(cell);
    }

    const fullId = Variable.id(this.id, cell.id);
    // if the variable with same id already exists
    // redefine: delete and create a new variable
    if (this.variablesById.has(fullId)) {
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
      return builtIn;
    }

    if (cell.mutable) {
      return this.defineMutable(cell);
    }

    if (cell.view) {
      return this.defineView(cell);
    }

    const fullId = Variable.id(this.id, cell.id);
    const before = this.variablesById.get(fullId);
    // if the variable does not exist, create a new one
    if (!before) {
      return this.define(cell);
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
    this.onRemove(before);

    cell.version = before.version + 1;
    const after = Variable.create({
      module: this,
      cell,
    });

    this.onCreate(after);
    console.log(after);
    this.runtime.schedule();

    return after;
  }

  // delete a variable by id
  delete(id: string) {
    const fullId = Variable.id(this.id, id);
    const variable = this.variablesById.get(fullId);

    // builtin variablesById cannot be deleted
    if (variable?.builtin) return;

    if (variable) {
      variable.stop();
      this.disconnect(variable);
      this.onRemove(variable);
      variable.delete({ module: true });
    }
  }

  onCreate(variable: Variable, dirty = true) {
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

    this.connect(variable);
  }

  // connect the variable with the module local variablesById
  // imports from other modules are done explicitly using import function
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

  onRemove(variable: Variable) {
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
      if (input.state.isPending) {
        this.runtime.markDirty(input);
      }
    });

    this.disconnect(variable);
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
