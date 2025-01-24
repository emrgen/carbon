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

  constructor(runtime: Runtime, id: string, name: string, version: string) {
    this.runtime = runtime;
    this.id = id;
    this.name = name;
    this.version = new SemVer(version);
  }

  // create a new variable with the given definition
  // if the variable already exists, redefine it
  define(id: string, name: string, inputs: string[], def: Function) {
    if (this.variableByNames.has(id)) {
      this.redefine(id, name, inputs, def);
      return this.variableByNames.get(id);
    }

    if (this.variableByNames.has(name)) {
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

    if (!this.variableByNames.has(name)) {
      this.variableByNames.set(name, []);
    }

    this.variableByNames.get(name)?.push(variable);
    this.variables.set(id, variable);

    return variable;
  }

  // redefine a variable with the given definition
  // optionally change the name, inputs, or definition
  redefine(id: string, name?: string, inputs?: string[], def?: Function) {
    if (!name && !inputs && !def) {
      return;
    }

    const variable = this.variables.get(id);
    if (variable) {
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
      const variable = this.variables.get(id);
      if (variable) {
        variable.delete({ module: true });
        this.variableByNames.delete(id);
        return;
      }
    }

    {
      const variable = this.variables.get(id);
      if (variable) {
        variable.delete({ module: true });
        const variables = this.variableByNames.get(variable.name);
        this.variableByNames.set(variable.name, variables?.filter((v) => v.id !== id) ?? []);
      }
    }
  }

  // variable by id
  variable(id: string) {
    return this.variables.get(id);
  }
}