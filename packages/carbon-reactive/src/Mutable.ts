import { isEqual, isObject } from "lodash";
import { ModuleVariableName } from "./Module";
import { Runtime } from "./Runtime";
import { MutableAccessor } from "./types";
import { Variable } from "./Variable";
import { RuntimeError } from "./x";

// Mutable is a class that stores mutable variablesById.
// Mutable variablesById can be changed at runtime from any cell
// and can be accessed from any cell.
export class Mutable {
  private variables: Map<ModuleVariableName, Variable> = new Map();
  private values: Map<ModuleVariableName, any> = new Map();
  private outputsNames: Map<ModuleVariableName, string[]> = new Map();

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
    return `mutable_${name}`;
  }

  static visibleId(id: string) {
    return `visible/${id}`;
  }

  static visibleName(name: string) {
    return `visible_${name}`;
  }

  constructor(readonly runtime: Runtime) {}

  add(name: ModuleVariableName, variable: Variable) {
    // add a mutable variable to the mutable store
    this.variables.set(name, variable);
  }

  // create a local mutable variable with the given name and value
  define(name: ModuleVariableName, variable: any, dependents: string[]) {
    this.values.set(name, variable);
    this.outputsNames.set(name, dependents);
  }

  has(name: ModuleVariableName) {
    return this.values.has(name);
  }

  // delete a mutable variable by name
  delete(name: ModuleVariableName) {
    this.values.delete(name);
    this.outputsNames.delete(name);
  }

  // returns a mutable accessor for the given name
  // the accessor can be used to get and set the value of the mutable variable
  accessor<T = any>(name: ModuleVariableName): MutableAccessor<T> {
    const that = this;
    const variable = that.variables.get(name);
    if (!variable) {
      throw RuntimeError.notDefined(`mutable ${name}`);
    }

    return {
      mutable: true,
      get value() {
        if (!that.values.has(name)) {
          throw RuntimeError.notDefined(`mutable ${name}`);
        }

        return that.values.get(name);
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

        const oldValue = that.values.get(name);
        // no change, do nothing
        if (value === oldValue) {
          return;
        }

        // no change, do nothing
        if (isObject(value) && isObject(oldValue) && isEqual(value, oldValue)) {
          return;
        }

        that.variables.set(name, value);

        // console.log("setting mutable", name, value, that.outputsNames.get(name));
        that.outputsNames.get(name)?.forEach((outputName) => {
          // mark the variable as dirty in the runtime
          const mutableVariable = variable.module.variablesByName.get(outputName);
          mutableVariable?.forEach((variable) => {
            // console.log("marking dirty", name, variable.id.toString());
            variable.stop();
            variable.pending();
            that.runtime.markDirty(variable);
          });
        });

        // request the runtime to update the dirty variables
        that.runtime.schedule();
      },
    };
  }

  toString() {
    return `Mutable(${Array.from(this.variables.keys())})`;
  }
}
