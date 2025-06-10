import { isObject } from "lodash";
import { ModuleVariableName } from "./Module";
import { Runtime } from "./Runtime";
import { MutableAccessor } from "./types";
import { RuntimeError } from "./x";

// Mutable is a class that stores mutable variables.
// Mutable variables can be changed at runtime from any cell
// and can be accessed from any cell.
export class Mutable {
  variables: Map<ModuleVariableName, any> = new Map();

  static isMutable(obj: any): boolean {
    // @ts-ignore
    return isObject(obj) && obj.mutable === true;
  }

  static hiddenId(name: string) {
    return `hidden/${name}`;
  }

  static hiddenName(name: string) {
    return `hidden@${name}`;
  }

  static mutableId(name: string) {
    return `mutable/${name}`;
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

  // create an accessor for a mutable variable
  // the accessor is an object with a value property that can be read and written
  accessor<T>(name: ModuleVariableName): MutableAccessor<T> {
    const that = this;

    return {
      mutable: true,
      get value() {
        if (!that.variables.has(name)) {
          const variable = that.runtime.moduleVariables.get(name);
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
          const variable = that.runtime.variables.get(name);
          if (variable) {
            if (variable.error) {
              throw variable.error;
            }
          }

          throw RuntimeError.notDefined(`mutable ${name}`);
        }

        that.variables.set(name, value);

        const mutableVariable = that.runtime.moduleVariables.get(name);
        mutableVariable?.forEach((variable) => {
          that.runtime.dirty.add(variable);
        });
      },
    };
  }

  toString() {
    return `Mutable(${Array.from(this.variables.keys())})`;
  }
}
