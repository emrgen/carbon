import { isEqual, isObject } from "lodash";
import { ModuleVariableName } from "./Module";
import { Runtime } from "./Runtime";
import { MutableAccessor } from "./types";
import { RuntimeError } from "./x";

// Mutable is a class that stores mutable variablesById.
// Mutable variablesById can be changed at runtime from any cell
// and can be accessed from any cell.
export class Mutable {
  variables: Map<ModuleVariableName, any> = new Map();

  static isMutable(obj: any): boolean {
    // @ts-ignore
    return isObject(obj) && obj.mutable === true;
  }

  static hiddenId(id: string) {
    return `hidden/${id}`;
  }

  static hiddenName(name: string) {
    return `hidden@${name}`;
  }

  static mutableId(id: string) {
    return `mutable/${id}`;
  }

  static mutableName(name: string) {
    return `mutable@${name}`;
  }

  constructor(readonly runtime: Runtime) {}

  // create a local mutable variable with the given name and value
  define(name: ModuleVariableName, value: any) {
    this.variables.set(name, value);
  }

  has(name: ModuleVariableName) {
    return this.variables.has(name);
  }

  // delete a mutable variable by name
  delete(name: ModuleVariableName) {
    this.variables.delete(name);
  }

  // returns a mutable accessor for the given name
  // the accessor can be used to get and set the value of the mutable variable
  accessor<T = any>(name: ModuleVariableName): MutableAccessor<T> {
    const that = this;

    return {
      mutable: true,
      get value() {
        if (!that.variables.has(name)) {
          const variable = that.runtime.variablesByName.get(name);
          console.log(variable);
          if (variable) {
            console.log("variable", variable);
          }
          throw RuntimeError.notDefined(`mutable ${name}`);
        }

        return that.variables.get(name);
      },
      set value(value: any) {
        if (!that.variables.has(name)) {
          const variable = that.runtime.variablesById.get(name);
          if (variable) {
            if (variable.error) {
              throw variable.error;
            }
          }

          throw RuntimeError.notDefined(`mutable ${name}`);
        }

        const oldValue = that.variables.get(name);
        // no change, do nothing
        if (value === oldValue) {
          return;
        }

        // no change, do nothing
        if (isObject(value) && isObject(oldValue) && isEqual(value, oldValue)) {
          return;
        }

        that.variables.set(name, value);

        // mark the variable as dirty in the runtime
        const mutableVariable = that.runtime.variablesByName.get(name);
        mutableVariable?.forEach((variable) => {
          that.runtime.dirty.add(variable);
        });

        // request the runtime to update the dirty variables
        that.runtime.refresh();
      },
    };
  }

  toString() {
    return `Mutable(${Array.from(this.variables.keys())})`;
  }
}
