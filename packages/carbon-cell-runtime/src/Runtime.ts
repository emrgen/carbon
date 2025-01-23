import { uniq, uniqBy } from "lodash";
import { SemVer } from "semver";
import { Module, ModuleNameVersion } from "./Module";
import { Variable, VariableName } from "./Variable";

// Think a whole notebook as a runtime
export class Runtime {
  id: string;
  version: SemVer;

  // each variable refresh updates the version
  clock: number = 0;

  // save the module using moduleName@version as key
  modules: Map<ModuleNameVersion, Module> = new Map();

  // multiple modules may have variable with same name
  // variable defined later will overwrite the previous one
  // deleting a variable will reveal the previous one
  variables: Map<VariableName, Variable> = new Map();

  // variables that are dirty and need to be recomputed
  dirty: Set<Variable> = new Set();

  static create(id: string, version: string) {
    return new Runtime(id, version);
  }

  constructor(id: string, version: string) {
    this.id = id;
    this.version = new SemVer(version);
  }

  module(id: string, name: string, version: string) {
    const modVersion = new SemVer(version);
    // if the module is already existing, return it
    if (this.modules.has(`${id}@${modVersion.toString()}`)) {
      return this.modules.get(id);
    }

    const mod = Module.create(this, id, name, version);
    this.modules.set(id, mod);

    return mod;
  }

  compute() {
    const outputs = new Map<string, Variable[]>();
    this.variables.forEach((variable) => {
      variable.indegree = uniq(variable.inputArgs).length;
      variable.inputArgs.forEach((input) => {
        if (!outputs.has(input)) {
          outputs.set(input, []);
        }
        outputs.get(input)?.push(variable);
      });
    });

    // const queue = Array.from(this.variables.values()).filter((variable) => variable.indegree === 0);
    // const topologicalOrder: Variable[] = []
    // while (queue.length) {
    //   const variable = queue.shift()!
    //   topologicalOrder.push(variable);
    //   variable.outputs.forEach((output) => {
    //     output.indegree--
    //     if (output.indegree === 0) {
    //       queue.push(output)
    //     }
    //   })
    // }
  }

  connect() {
    // connect the variables
    this.variables.forEach((variable) => {
      variable.inputArgs.forEach((input) => {
        const v = this.variables.get(input);
        if (v) {
          v.outputs.push(variable);
          variable.inputs.push(v);
        }
      });
    });

    this.variables.forEach((variable) => {
      variable.inputs = uniqBy(variable.inputs, (v) => v.name);
      variable.outputs = uniqBy(variable.outputs, (v) => v.name);
    });
  }

  // check if there is a circular dependency
  circular() {
    const visited = new Set<string>();
    const stack = new Set<string>();

    const dfs = (variable: Variable) => {
      if (visited.has(variable.name)) {
        throw new Error(
          `Circular dependency detected: ${Array.from(stack).join(" -> ")} -> ${variable.name}`,
        );
      }

      if (visited.has(variable.name)) {
        return;
      }

      visited.add(variable.name);
      stack.add(variable.name);

      variable.outputs.forEach((output) => {
        dfs(output);
      });

      stack.delete(variable.name);
    };

    // find the roots
    const roots = Array.from(this.variables.values()).filter(
      (variable) => variable.inputs.length === 0,
    );

    roots.forEach((variable) => {
      dfs(variable);
    });
  }
}