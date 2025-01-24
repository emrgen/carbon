import { EventEmitter } from "events";
import { find, noop } from "lodash";
import { SemVer } from "semver";
import { Graph } from "./Graph";
import { Module, ModuleNameVersion } from "./Module";
import { Promix } from "./Promix";
import { Variable, VariableName } from "./Variable";

// Think a whole notebook as a runtime
export class Runtime extends EventEmitter {
  id: string;
  version: SemVer;

  // each variable refresh updates the version
  clock: number = 0;

  // save the module using moduleName@version as key
  modules: Map<ModuleNameVersion, Module> = new Map();

  graph: Graph<Variable>;

  // multiple modules may have variable with same name
  // variable defined later will overwrite the previous one
  // deleting a variable will reveal the previous one
  variables: Map<VariableName, Variable> = new Map();

  // generated from variables map
  variablesByName: Map<string, Variable[]> = new Map();

  created: Set<Variable> = new Set();

  // variables that are dirty and need to be recomputed
  dirty: Set<Variable> = new Set();

  // generators that are dirty and need to be recomputed
  generators: Set<Variable> = new Set();

  computing: boolean = false;

  static create(id: string, version: string) {
    return new Runtime(id, version);
  }

  constructor(id: string, version: string) {
    super();
    this.id = id;
    this.version = new SemVer(version);
    this.graph = new Graph();
  }

  // create a new module with the given name and version
  define(id: string, name: string, version: string) {
    const modVersion = new SemVer(version);
    // if the module is already existing, return it
    const key = `${id}@${modVersion.toString()}`;
    if (this.modules.has(key)) {
      return this.modules.get(key) as Module;
    }

    const mod = Module.create(this, id, name, version);
    this.modules.set(id, mod);

    return mod;
  }

  onCreate(variable: Variable) {
    this.variables.set(variable.name, variable);
  }

  onRemove(variable: Variable) {
    this.variables.delete(variable.name);
  }

  recompute() {}

  // connect the dirty variables and find out the roots
  precompute() {
    // first connect the created variables

    // add the created variables to the dirty set
    this.created.forEach((variable) => {
      this.dirty.add(variable);
    });
    this.created.clear();

    const roots = this.graph.topologicalRoots(this.dirty);
    const nodes = this.graph.topological(this.dirty);

    const pending: Promix<any>[] = [];

    // connect the nodes with the inputs
    // NOTE: computation is not done here
    nodes.forEach((node) => {
      const inputs = this.graph.inputs(node).map((input) => input.promise);
      node.promise = node.promise.next(noop);
      pending.push(node.promise);

      const fulfilled = (value) => {
        return node.promise.fulfilled(value);
      };

      // truly independent variables
      if (!inputs.length) {
        const done = node.promise.then((x) => node.compute([]).then(fulfilled));

        pending.push(done);
      } else {
        console.log(
          node.id,
          inputs.map((input) => input.id),
        );
        // if the dirty nodes inputs has node changed in the current iteration
        if (find(roots, (input) => input.id === node.id)) {
          const done = node.promise.then(() => {
            return Promix.all(inputs).then((inputs) => node.compute(inputs).then(fulfilled));
          });

          pending.push(done);
        } else {
          // if the dirty nodes inputs has node changed in the previous iteration
          const done = node.promise.all(inputs).then((inputs) => node.compute(inputs).then(fulfilled));

          pending.push(done);
        }
      }

      console.log("connected: " + node.key);
    });

    // then connect the dirty variables
    return {
      roots,
      pending,
    };
  }

  // compute the roots
  compute(roots: Variable[], pending: Promix<any>[]) {
    this.computing = true;

    // fulfill the roots with the computed inputs

    Promix.all(pending).then(() => {
      this.computing = false;
      setTimeout(() => {
        this.postcompute();
      }, 0);
    });
  }

  // if there were generators, run them
  postcompute() {}
}
