import { noop } from "lodash";
import { SemVer } from "semver";
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
  define(id: string, name: string, dependencies: string[], def: Function) {
    if (this.variables.has(id)) {
      this.redefine(id, name, dependencies, def);
      return this.variables.get(id);
    }

    // create a new variable with the given definition
    const variable = Variable.create({
      module: this,
      id,
      name,
      dependencies,
      definition: def,
      version: this.graph.version + 1,
    });

    if (!this.variableByNames.has(name)) {
      this.variableByNames.set(name, []);
    }

    // allow multiple variables with the same name
    // we can throw an error during runtime if the variable is used in computation
    this.variableByNames.get(name)?.push(variable);
    this.variables.set(id, variable);

    this.runtime.onCreate(variable);

    return variable;
  }

  // redefine a variable with the given definition
  // optionally change the name, inputs, or definition
  redefine(id: string, name: string = "", inputs: string[] = [], def: Function = noop) {
    const variable = this.variables.get(id);
    if (variable) {
      this.runtime.onRemove(variable);
      variable.version = this.graph.version + 1;
      variable.redefine(name, inputs, def);
      this.runtime.onCreate(variable);
    }
  }

  // delete a variable by id
  delete(id: string) {
    const variable = this.variables.get(id);
    if (variable) {
      this.runtime.onRemove(variable);
      variable.delete({ module: true });
      this.variableByNames.delete(id);
      return;
    }
  }
}
