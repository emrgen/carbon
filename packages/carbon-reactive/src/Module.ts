import { uniqBy } from "lodash";
import { SemVer } from "semver";
import { Cell } from "./Cell";
import { Mutable } from "./Mutable";
import { Runtime } from "./Runtime";
import { MutableAccessor } from "./types";
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

  // recompute the variable with the given name
  recompute(name: string) {
    const variable = this.value(name);
    if (!variable) return;

    this.runtime.dirty.add(variable);
    this.runtime.tryRecompute();
  }

  private value(name: string): Variable | undefined {
    const fullName = Variable.fullName(this.id, name);
    const variables = this.runtime.variablesByName.get(fullName);
    if (!variables) return;

    if (variables.length > 1) {
      console.error("multiple variablesById with the same name", name);
      return;
    }

    return variables[0];
  }

  // builtin variable by name
  builtin(name: string) {
    return this.runtime.builtinVariables.get(name);
  }

  // variable by id, optionally return a mutable variable
  variable(id: string, mutable?: boolean): Variable | undefined {
    if (mutable) {
      const mutableId = Mutable.mutableId(id);
      return this.runtime.variablesById.get(Variable.id(this.id, mutableId));
    }

    return this.runtime.variablesById.get(Variable.id(this.id, id));
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
  import(name: string, alias: string, module: Module) {
    // check if the variable exists in the module
    const variable = module.value(name);
    if (!variable) {
      console.error("variable not found", name);
      return;
    }

    const cell = Cell.create({
      id: `imported(${module.id}/${randomString(10)})`,
      name: alias,
      code: `(x) => x`,
      // fully qualified name of the variable in the module
      dependencies: [Variable.fullName(module.id, name)],
      definition: (x) => x,
      builtin: variable?.builtin,
    });

    return this.define(cell);
  }

  // define a mutable variable with the given name and value
  defineMutable(cell: Cell): Variable {
    const { name } = cell;

    const hiddenId = Mutable.hiddenId(cell.id);
    const hiddenName = Mutable.hiddenName(name);
    const mutableId = Mutable.mutableId(cell.id);
    const mutableName = Mutable.mutableName(name);

    // module local id for the mutable variable
    const moduleVariableName = Variable.fullName(this.id, name);
    const mut = this.runtime.mutable;

    this.define(
      Cell.from(hiddenId, hiddenName, cell.dependencies, (...args) => {
        const value = cell.definition(...args);
        // define a mutable variable with the given name and value
        mut.define(moduleVariableName, value);

        return value;
      }),
    );

    // define the mutable part of the mutable variable
    this.define(
      Cell.create({
        id: mutableId,
        name: mutableName,
        dependencies: [hiddenName],
        definition: function () {
          return mut.accessor<any>(moduleVariableName);
        },
      }),
    );

    // define the immutable part of the mutable variable
    // when the mutable variable is changed, the immutable part will be recomputed
    return this.define(
      Cell.create({
        id: cell.id,
        name: cell.name,
        dependencies: [mutableName],
        definition: (accessor: MutableAccessor<any>) => accessor.value,
      }),
    );
  }

  private findBuiltIn(cell: Cell) {
    // check if the cell is a builtin variable
    if (cell.builtin) {
      const fullName = Variable.fullName(this.id, cell.name);
      const moduleVariables = this.runtime.variablesByName.get(fullName);
      if (moduleVariables?.length) {
        console.error("builtin variable already exists", fullName);
        return moduleVariables[0];
      }
    }

    return null;
  }

  // create a new variable with the given definition
  // if the variable already exists, redefine it
  define(cell: Cell): Variable {
    const builtIn = this.findBuiltIn(cell);
    if (builtIn) {
      return builtIn;
    }

    if (cell.mutable) {
      return this.defineMutable(cell);
    }

    const fullId = Variable.id(this.id, cell.id);
    // if the variable with same id already exists
    // just redefine it: delete and recreate
    if (this.runtime.variablesById.has(fullId)) {
      return this.redefine(cell);
    }

    // create a new variable with the given definition
    const variable = Variable.create({
      module: this,
      cell,
    });

    // console.log("define", id, name, variable.dependencies);
    this.connect(variable);
    LOG &&
      console.log(
        variable.id,
        variable.outputs.map((v) => v.id),
      );

    this.onCreate(variable);

    return variable;
  }

  // redefine a variable with the given definition
  // optionally change the name, inputs, or definition
  redefine(cell: Cell): Variable {
    const builtIn = this.findBuiltIn(cell);
    if (builtIn) {
      return builtIn;
    }

    if (cell.mutable) {
      return this.defineMutable(cell);
    }

    const fullId = Variable.id(this.id, cell.id);
    const variable = this.runtime.variablesById.get(fullId);
    if (!variable) {
      return this.define(cell);
    }

    // if the cell has not changed, we just need to recompute
    if (variable.cell.eq(cell)) {
      console.log("redefine", cell.id, cell.name, "no change");
      variable.version += 1;
      return variable;
    }

    // name of the variable has changed
    this.onRemove(variable);
    this.disconnect(variable);

    variable.version = this.graph.version + 1;
    variable.redefine(cell);

    this.connect(variable);
    this.onCreate(variable);

    return variable;
  }

  // delete a variable by id
  delete(id: string) {
    const fullId = Variable.id(this.id, id);
    const variable = this.runtime.variablesById.get(fullId);

    // builtin variablesById cannot be deleted
    if (variable?.builtin) return;

    if (variable) {
      this.disconnect(variable);
      variable.delete({ module: true });
      this.onRemove(variable);
    }
  }

  onCreate(variable: Variable) {
    this.runtime.onCreate(variable);

    // connect the variable with the module local variablesById
    this.variablesById.set(variable.id, variable);

    // connect the variable with the module local variablesByName
    const fullName = Variable.fullName(this.id, variable.name);
    if (!this.variablesByName.has(fullName)) {
      this.variablesByName.set(fullName, []);
    }
    this.variablesByName.get(fullName)?.push(variable);
  }

  onRemove(variable: Variable) {
    this.runtime.onRemove(variable);
    // remove the variable from the module local variablesById
    this.variablesById.delete(variable.id);

    // remove the variable from the module local variablesByName
    if (this.variablesByName.has(variable.name)) {
      const variables = this.variablesByName.get(variable.name);
      if (variables) {
        this.variablesByName.set(
          variable.name,
          variables.filter((v) => v.id !== variable.id),
        );
      }
    }

    variable.removed();
  }

  // connect the variable with the module local variablesById
  // imports from other modules are done explicitly using import function
  private connect(variable: Variable) {
    variable.inputs = variable.dependencies
      .map((name) => this.runtime.variablesByName.get(name))
      .filter(Boolean)
      .flat() as Variable[];

    variable.inputs.forEach((input) => {
      input.outputs.push(variable);
      input.outputs = uniqBy(input.outputs, "id");
    });

    this.runtime.variablesById.forEach((v) => {
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

  private disconnect(variable: Variable) {
    variable.outputs.forEach((output) => {
      this.runtime.dirty.add(output);
    });
  }
}
