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
export type ModuleVariableName = string; // `${moduleId}@${variableName}`;

// Module represents a collection of variables
export class Module {
  runtime: Runtime;

  // global unique id of the module, auto generated at the runtime
  id: string;
  // name of the module
  name: string;
  // version of the module
  version: SemVer;

  static create(runtime: Runtime, id: string, name: string, version: string) {
    return new Module(runtime, id, name, version);
  }

  constructor(runtime: Runtime, uid: string, name: string, version: string) {
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
    return this.runtime.variables;
  }

  get moduleVariables() {
    return this.runtime.moduleVariables;
  }

  recompute(name: string) {
    const variable = this.value(name);
    if (!variable) return;

    this.runtime.dirty.add(variable);
    this.runtime.tryRecompute();
  }

  value(name: string): Variable | undefined {
    const fullName = Variable.fullName(this.id, name);
    const variables = this.moduleVariables.get(fullName);
    if (!variables) return;

    if (variables.length > 1) {
      console.error("multiple variables with the same name", name);
      return;
    }

    return variables[0];
  }

  builtin(name: string) {
    return this.runtime.builtinVariables.get(name);
  }

  // variable by id
  variable(id: string) {
    return this.variables.get(Variable.id(this.id, id));
  }

  derive(id: string, name: string, injects: (string | { name: string; alias: string })[], fromModule: Module) {
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

  import(name: string, alias: string, module: Module) {
    // check if the variable exists in the module
    const variable = module.value(name);
    if (!variable) {
      console.error("variable not found", name);
      return;
    }

    const cell = Cell.create({
      id: `imported/${module.id}/${randomString(10)}`,
      name: alias,
      code: `(x) => x`,
      dependencies: [Variable.fullName(module.id, name)],
      definition: (x) => x,
      builtin: variable?.builtin,
    });

    return this.define(cell);
  }

  // create a new variable with the given definition
  // if the variable already exists, redefine it
  define(cell: Cell) {
    const fullId = Variable.id(this.id, cell.id);
    if (this.variables.has(fullId)) {
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

    this.runtime.onCreate(variable);

    return variable;
  }

  // redefine a variable with the given definition
  // optionally change the name, inputs, or definition
  redefine(cell: Cell): Variable {
    const fullId = Variable.id(this.id, cell.id);
    const variable = this.variables.get(fullId);
    if (!variable) {
      return this.define(cell);
    }

    if (variable.builtin) {
      console.error("builtin variable cannot be redefined");
      return variable;
    }

    // if the cell has not changed, we just need to recompute
    if (variable.cell.eq(cell)) {
      console.log("redefine", cell.id, cell.name, "no change");
      variable.version += 1;
      this.runtime.dirty.add(variable);
      return variable;
    }

    // if the cell code has changed but the name is same we refine and keep the old connections
    // if (variable.name === cell.name) {
    //   LOG && console.log("redefine", cell.id, cell.name, "same name");
    //   const newVariable = Variable.create({
    //     module: this,
    //     cell,
    //   });
    //
    //   // keep the old connections
    //   newVariable.inputs = [...variable.inputs];
    //   newVariable.outputs = [...variable.outputs];
    //
    //   // update the graph with the old variable removed
    //   this.runtime.onRemove(variable);
    //   // update the graph with the new variable added
    //   this.runtime.onCreate(newVariable);
    //
    //   return newVariable;
    // }

    // name of the variable has changed
    this.runtime.onRemove(variable);
    this.disconnect(variable);

    variable.version = this.graph.version + 1;
    variable.redefine(cell);

    this.connect(variable);
    this.runtime.onCreate(variable);

    return variable;
  }

  // delete a variable by id
  delete(id: string) {
    const fullId = Variable.id(this.id, id);
    const variable = this.variables.get(fullId);

    // builtin variables cannot be deleted
    if (variable?.builtin) return;

    if (variable) {
      this.disconnect(variable);
      variable.delete({ module: true });
      this.runtime.onRemove(variable);
    }
  }

  // connect the variable with the module local variables
  private connect(variable: Variable) {
    variable.inputs = variable.dependencies
      .map((name) => this.moduleVariables.get(name))
      .filter(Boolean)
      .flat() as Variable[];

    variable.inputs.forEach((input) => {
      input.outputs.push(variable);
      input.outputs = uniqBy(input.outputs, "id");
    });

    this.variables.forEach((v) => {
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

  private disconnect(variable: Variable) {}
}
