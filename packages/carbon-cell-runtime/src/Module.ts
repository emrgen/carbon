import { uniqBy } from "lodash";
import { SemVer } from "semver";
import { Cell } from "./Cell";
import { Runtime } from "./Runtime";
import { Variable, VariableId, VariableName } from "./Variable";

// ModuleNameVersion is a string that represents a module name and version
// e.g. "module@1" or "module@1.0" or "module@1.0.0"
export type ModuleNameVersion = string;

// Module represents a collection of variables
export class Module {
  runtime: Runtime;

  // global unique id of the module, auto generated at the runtime
  id: string;
  // name of the module
  name: string;
  // version of the module
  version: SemVer;

  variables: Map<VariableId, Variable> = new Map();
  variableByNames: Map<VariableName, Variable[]> = new Map();

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

  // variable by id
  variable(id: string) {
    return this.variables.get(id);
  }

  // create a new variable with the given definition
  // if the variable already exists, redefine it
  define(cell: Cell) {
    const { id, name } = cell;
    if (this.variables.has(id)) {
      return this.redefine(cell);
    }

    // create a new variable with the given definition
    const variable = Variable.create({
      module: this,
      cell,
    });

    if (!this.variableByNames.has(name)) {
      this.variableByNames.set(name, []);
    }

    // allow multiple variables with the same name
    // we can throw an error during runtime if the variable is used in computation
    this.variableByNames.get(name)?.push(variable);
    this.variables.set(id, variable);

    // console.log("define", id, name, variable.dependencies);
    this.connect(variable);
    console.log(variable.id, variable.outputs.map(v => v.id))

    this.runtime.onCreate(variable);

    return variable;
  }

  // redefine a variable with the given definition
  // optionally change the name, inputs, or definition
  redefine(cell: Cell) {
    const variable = this.variables.get(cell.id);
    if (!variable) {
      return this.define(cell);
    }

    // if the cell has not changed, we just need to recompute
    if (variable.cell.eq(cell)) {
      console.log("redefine", cell.id, cell.name, "no change");
      variable.version += 1;
      this.runtime.dirty.add(variable);
      return variable;
    }

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
    const variable = this.variables.get(id);
    if (variable) {
      this.runtime.onRemove(variable);
      this.disconnect(variable);
      variable.delete({ module: true });
      this.variableByNames.delete(id);
    }
  }

  // connect the variable with the module local variables
  private connect(variable: Variable) {
    // console.log(variable.name, variable.dependencies);
    variable.inputs = variable.dependencies
      .map((name) => {
        return this.variableByNames.get(name);
      })
      .filter(Boolean)
      .flat() as Variable[];

    variable.inputs.forEach((v) => {
      v.outputs.push(variable);
      v.outputs = uniqBy(v.outputs, "id");
    });

    this.variables.forEach((v) => {
      if (v.id === variable.id) return;
      if (v.dependencies.includes(variable.name)) {
        v.inputs.push(variable);
        v.inputs = uniqBy(v.inputs, "id");

        // conect the output
        variable.outputs.push(v)
        variable.outputs = uniqBy(variable.outputs, 'id')
      }
    });
  }

  private disconnect(variable: Variable) {}
}
