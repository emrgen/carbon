import { SemVer } from "semver";
import { Runtime } from "./Runtime";
import { Variable, VariableId, VariableName } from "./Variable";
import { RuntimeError } from "./x";

// ModuleNameVersion is a string that represents a module name and version
// e.g. "module@1" or "module@1.0" or "module@1.0.0"
export type ModuleNameVersion = string;

// Module represents a collection of variables
export class Module {
  runtime: Runtime;

  id: string;
  name: string;
  version: SemVer;

  variableNames: Map<VariableName, Variable> = new Map();
  variableIds: Map<VariableId, Variable> = new Map();

  static create(runtime: Runtime, id: string, name: string, version: string) {
    return new Module(runtime, id, name, version);
  }

  constructor(runtime: Runtime, id: string, name: string, version: string) {
    this.runtime = runtime;
    this.id = id;
    this.name = name;
    this.version = new SemVer(version);
  }

  // create a new variable with the given definition
  // if the variable already exists, redefine it
  define(id: string, name: string, inputs: string[], def: Function) {
    if (this.variableNames.has(id)) {
      this.redefine(id, name, inputs, def);
      return this.variableNames.get(id);
    }

    if (this.variableNames.has(name)) {
      throw RuntimeError.of(`Variable ${name} defined more than once`);
    }

    // create a new variable with the given definition
    const variable = Variable.create({
      module: this,
      id,
      name,
      inputs,
      definition: def,
    });

    this.variableNames.set(name, variable);
    this.variableIds.set(id, variable);

    return variable;
  }

  // redefine a variable with the given definition
  // optionally change the name, inputs, or definition
  redefine(id: string, name?: string, inputs?: string[], def?: Function) {
    if (!name && !inputs && !def) {
      return;
    }

    const variable = this.variableNames.get(id);

    if (variable) {
      if (name && variable.name !== name && this.variableNames.has(name)) {
        throw RuntimeError.of(`Variable ${name} defined more than once`);
      }

      if (!name) {
        name = variable.name;
      }

      if (!inputs) {
        inputs = variable.inputs.map((v) => v.name);
      }

      if (!def) {
        def = variable.definition;
      }

      variable.redefine(name, inputs, def);
    }
  }

  // delete a variable by name or id
  delete(id: string) {
    {
      const variable = this.variableIds.get(id);
      if (variable) {
        variable.delete({ module: true });
        this.variableNames.delete(id);
        return;
      }
    }

    {
      const variable = this.variableNames.get(id);
      if (variable) {
        variable.delete({ module: true });
        this.variableNames.delete(variable.id);
      }
    }
  }

  // variable by name or id
  variable(id: string) {
    return this.variableNames.get(id) || this.variableIds.get(id);
  }
}