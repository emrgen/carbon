import { ModuleVariableId } from "./Module";
import { Runtime } from "./Runtime";
import { RuntimeError } from "./x";

export class Mutable {
  variables: Map<string, any> = new Map();

  dirty: Set<ModuleVariableId> = new Set();

  constructor(readonly runtime: Runtime) {}

  define(name: string, value: any) {
    this.variables.set(name, value);
    this.dirty.add(name);
  }

  delete(name: string) {
    this.variables.delete(name);
    this.dirty.delete(name);
  }

  accessor(name: string) {
    return Object.defineProperty({}, name, {
      set: (value) => {
        if (!this.variables.has(name)) {
          const variable = this.runtime.variables.get(name);
          if (variable) {
            if (variable.error) {
              throw variable.error;
            }
          }

          throw RuntimeError.notDefined(`mutable ${name}`);
        }

        this.variables.set(name, value);
        this.dirty.add(name);
      },
      get: () => {
        if (!this.variables.has(name)) {
          const variable = this.runtime.moduleVariables.get(name);
          console.log(variable);
          if (variable) {
            console.log("variable", variable);
          }
          throw RuntimeError.notDefined(`mutable ${name}`);
        }

        return this.variables.get(name);
      },
    });
  }

  toString() {
    return `Mutable(${Array.from(this.variables.keys())})`;
  }
}
