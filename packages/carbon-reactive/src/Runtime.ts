import { EventEmitter } from "events";
import { entries, last } from "lodash";
import { SemVer } from "semver";
import { Cell } from "./Cell";
import { Graph } from "./Graph";
import { Module, ModuleNameVersion, ModuleVariableId, ModuleVariableName } from "./Module";
import { Mutable } from "./Mutable";
import { State, Variable, VariableName } from "./Variable";
import { RuntimeError } from "./x";

interface Builtins {
  [name: string]: any;
}

const LOG = 0;

// Think a whole notebook as a runtime.
export class Runtime extends EventEmitter {
  graph: Graph<Variable>;

  // save the module using moduleName@version as key
  modules: Map<ModuleNameVersion, Module> = new Map();

  // one module may have variable with same name
  variablesById: Map<ModuleVariableId, Variable> = new Map();

  // generated from variablesById map
  variablesByName: Map<ModuleVariableName, Variable[]> = new Map();

  // scheduled variables to be processed
  // variables that are dirty and need to be recomputed
  dirty: Map<ModuleVariableId, Variable> = new Map();

  // generators that are dirty and need to be recomputed
  generators: Set<Variable> = new Set();

  builtin: Module;

  builtinVariables: Map<VariableName, Variable> = new Map();

  // mutable variablesById store
  mutable: Mutable;

  version: number = 0;

  // connecting is true when the runtime is connecting the variablesById
  connecting: boolean = false;
  private paused: boolean = true;

  static create(builtins?: Builtins) {
    return new Runtime(builtins);
  }

  constructor(builtins: Builtins = {}) {
    super();
    this.graph = new Graph();
    this.mutable = new Mutable(this);

    const mod = Module.create(this, "mod:builtin", "mod:builtin", "0.0.1");

    // create builtins variablesById
    entries(builtins).forEach(([name, value]) => {
      const cell = Cell.create({
        id: "builtin/" + name,
        name,
        code: `() => {
          if (typeof value === "function") {
            return value();
          } else {
            return value;
          }
        }`,
        definition: () => {
          if (typeof value === "function") {
            return value();
          } else {
            return value;
          }
        },
        builtin: true,
      });

      // compute the variable in a lazy fation
      const variable = mod.define(cell, false, false);
      this.builtinVariables.set(name, variable);
    });

    this.builtin = mod;
  }

  // the default module is the builtin module
  get mod() {
    return this.builtin;
  }

  pause() {
    if (this.paused) return;
    this.paused = true;

    this.variablesById.forEach((v) => {
      // just pause all variable computations
      v.pause();
    });
  }

  play() {
    if (!this.paused) return;
    this.paused = false;

    // schedule the dirty variables to be recomputed
    this.schedule();
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
    this.modules.set(key, mod);

    // inject the builtin variable from the runtime into the module
    this.builtinVariables.forEach((variable) => {
      mod.import(variable.cell.name, variable.cell.name, this.builtin, false, false);
    });

    return mod;
  }

  markDirty(variable: Variable) {
    variable.version += 1;
    // console.log("markDirty", variable.name, variable.id, variable.version);
    this.dirty.set(variable.id, variable);
    return this;
  }

  // perform runtime specific actions for a new variable is created
  onCreate(variable: Variable, schedule = true, dirty = true) {
    this.variablesById.set(variable.id, variable);
    this.variablesByName.set(variable.name, this.variablesByName.get(variable.name) || []);
    this.variablesByName.get(variable.name)!.push(variable);

    if (dirty) {
      this.variablesByName.get(variable.name)?.forEach((v) => {
        this.markDirty(v);
      });
    }

    this.graph.addNode(variable);

    variable.inputs.forEach((input) => {
      this.graph.addEdge(input, variable);
    });

    variable.outputs.forEach((output) => {
      this.graph.addEdge(variable, output);
    });

    if (schedule) {
      this.schedule();
    }
  }

  // perform runtime specific actions for a variable is removed
  onRemove(variable: Variable, schedule = true, dirty = true) {
    this.variablesById.delete(variable.name);
    // if there were multiple variable with same name they become dirty
    const variables = this.variablesByName.get(variable.name);
    if (variables && dirty) {
      const remaining = variables.filter((v) => v.id !== variable.id);
      this.variablesByName.set(variable.name, remaining);
      remaining.forEach((v) => {
        this.markDirty(v);
      });
    }

    this.graph.removeNode(variable);
    variable.outputs.forEach((output) => {
      this.markDirty(output);
    });

    variable.inputs.forEach((input) => {
      if (input.state.isPending) {
        this.markDirty(input);
      }
    });

    if (schedule) {
      this.schedule();
    }
  }

  // stops the running nodes from being recomputed further
  // creates a new slot for the next play
  schedule() {
    if (this.paused) return;

    if (this.dirty.size === 0 && this.generators.size === 0) {
      return;
    }
    this.version += 1;

    const roots = new Map(this.dirty.entries());
    // variables that are dirty and need to be recomputed
    const dirty = Array.from(this.dirty.values()).filter((v) => v.version === this.version);
    this.dirty.clear();

    // console.log("DIRTY", Array.from(roots.values().map((v) => v.name)));

    const connected = Array.from(this.graph.connected(dirty).values());
    const cycles = Array.from(this.graph.cycles(dirty).values());

    // console.log(
    //   cycles.length,
    //   "cycles variables",
    //   cycles.map((v) => v.name),
    // );

    // mark all the nodes as pending
    connected.forEach((v) => {
      // if the variable is pending, do not mark it as pending again
      v.pause();
      v.pending();

      const missing = v.dependencies.find((dep) => !this.variablesByName.get(dep)?.length);
      if (missing) {
        v.reject(RuntimeError.notDefined(last(missing.split(":"))!));
      }
    });

    // console.log(
    //   connected.length,
    //   "connected variables",
    //   connected.map((v) => v.name),
    // );

    roots.values().forEach((v) => {
      // console.log(
      //   "inputs",
      //   v.name,
      //   v.inputs.map((i) => i.cell.name),
      //   v.inputs.map((i) => i.state1),
      // );

      // if some input is builtin and still not resolved, add the input to roots and remove the current dirty variable
      const unresolvedBuiltins = v.inputs.filter((i) => {
        return i.cell.builtin && i.state1 === State.UNDEFINED;
      });

      if (unresolvedBuiltins.length) {
        roots.delete(v.id);
        unresolvedBuiltins.forEach((vi) => {
          roots.set(vi.name, vi);
        });
      }
    });

    // console.log("inputs ROOTS", Array.from(roots.values().map((v) => v.name)));

    // all connected variables are now pending and have no running computation
    roots.forEach((root) => {
      const inputs = this.graph.inputs(root);
      // if the variable is pending, do not mark it as pending again
      return root.compute(inputs);
    });

    // marks the circular dependencies as rejected
    cycles.forEach((variable) => {
      variable.reject(RuntimeError.circularDependency(variable.cell.name));
    });
  }

  // play the dirty variablesById and their dependencies
  // private play() {
  //   LOG && console.log("----------------\n> recomputing\n----------------");
  //   if (this.dirty.size === 0) {
  //     // if no dirty variablesById schedule (to process pending generators)
  //     this.schedule();
  //     return;
  //   }
  //
  //   // console.log("play", this.dirty.size);
  //
  //   LOG &&
  //     console.log(
  //       "dirty",
  //       Array.from(this.dirty).map((v) => v.id),
  //     );
  //
  //   const { roots, pending, sorted, circular } = this.precompute(Array.from(this.dirty));
  //   this.dirty.clear();
  //
  //   LOG &&
  //     console.log(
  //       "roots",
  //       roots.map((v) => v.id),
  //       "pending",
  //       pending.map((v) => v.id),
  //       "circular",
  //       circular.map((v) => v.id),
  //     );
  //
  //   this.compute(roots, sorted, circular, pending);
  // }

  // connect the dirty variablesById and find out the roots
  // precompute(dirty: Variable[]) {
  //   this.connecting = true;
  //   LOG && console.log("----------------\n> precomputing\n----------------");
  //   const { roots, sorted, circular } = this.graph.topological(dirty);
  //
  //   const pending: Promix<any>[] = [];
  //
  //   const isRoot = (node) => {
  //     return find(roots, (root) => root.id === node.id);
  //   };
  //
  //   // connect the nodes with the inputs
  //   // NOTE: computation is not done here
  //   sorted.forEach((variable) => {
  //     // if the variable is pending from previous computation, reject it
  //     if (variable.promise.isPending) {
  //       variable.rejected(RuntimeError.recalculating(variable.name), variable.promise.version);
  //     }
  //     variable.promise = variable.promise.next(noop);
  //
  //     if (isRoot(variable)) {
  //       pending.push(variable.promise);
  //       return;
  //     }
  //
  //     const inputs = this.graph.inputs(variable).map((input) => input.promise);
  //     // console.log("before", node.id, node.promise.id);
  //     // console.log("after", node.id, node.promise.id);
  //
  //     // const fulfilled = (value) => {
  //     //   return node.promise.fulfilled(node);
  //     // };
  //
  //     // when all inputs are fulfilled, compute the variable
  //     const done = variable.promise.all(inputs).then((v) => {
  //       return variable.compute(v, variable.promise.version);
  //     });
  //
  //     // collect the pending promises
  //     pending.push(done);
  //
  //     LOG &&
  //       console.log(
  //         "connected:",
  //         variable.id,
  //         "<-",
  //         inputs.map((input) => input.id),
  //       );
  //   });
  //
  //   // pending.forEach((p) => {
  //   //   const v = this.variable(p.id);
  //   //   if (!v) return;
  //   //   v.promise = p;
  //   // });
  //
  //   this.connecting = false;
  //   // then connect the dirty variablesById
  //   return {
  //     roots,
  //     pending,
  //     sorted,
  //     circular,
  //   };
  // }

  // compute the roots
  // compute(roots: Variable[], sorted: Variable[], circular: Variable[], pending: Promix<any>[]) {
  //   LOG && console.log("----------------\n> compute\n----------------");
  //
  //   sorted.forEach((p) => p.pending());
  //
  //   // if there are circular dependencies, mark them with error
  //   circular.forEach((variable) => {
  //     // console.log("circular", variable.id);
  //     variable.promise = variable.promise.next(noop);
  //     variable.rejected(
  //       RuntimeError.circularDependency(variable.cell.name),
  //       variable.promise.version,
  //     );
  //   });
  //
  //   // find conflicting names
  //   const names = sorted.reduce((acc, v) => {
  //     if (!acc.has(v.name)) {
  //       acc.set(v.name, []);
  //     }
  //
  //     acc.get(v.name)!.push(v);
  //     return acc;
  //   }, new Map<string, Variable[]>());
  //
  //   // if there are conflicting names, mark them with error
  //   names.forEach((vs) => {
  //     if (vs.length > 1) {
  //       vs.forEach((v) => {
  //         v.rejected(RuntimeError.duplicateDefinition(v.cell.name), v.promise.version);
  //       });
  //       roots.splice(roots.indexOf(vs[0]), 1);
  //     }
  //   });
  //
  //   // resolve the roots with the computed inputs, if no
  //   roots.forEach((root) => {
  //     const inputs = this.graph.inputs(root).map((input) => input.promise);
  //     Promix.all(inputs).then((v) => {
  //       return root.compute(v, root.promise.version);
  //     });
  //   });
  //
  //   // console.log(
  //   //   "done computing",
  //   //   roots.map((v) => v.id),
  //   // );
  //   // this will allow next play to begin even before the current one is finished
  //   LOG &&
  //     console.log(
  //       "pending",
  //       pending.map((p) => p.id),
  //     );
  //
  //   // wait for all pending promises to be resolved before trying to play again
  //   return Promise.all(pending).then(() => {
  //     this.schedule();
  //   });
  // }

  // generate() {
  //   LOG && console.log("----------------\n> generate\n----------------");
  //   if (this.generators.size === 0) {
  //     return Promise.resolve();
  //   }
  //
  //   LOG &&
  //     console.log(
  //       "generators",
  //       Array.from(this.generators).map((v) => v.id),
  //     );
  //   const { roots, pending, circular } = this.precompute(Array.from(this.generators));
  //   this.generators.clear();
  //
  //   roots.forEach((variable) => {
  //     // console.log(count++);
  //     variable.generateNext().then(() => {
  //       this.schedule();
  //     });
  //   });
  //
  //   circular.forEach((variable) => {
  //     variable.promise = variable.promise.next(noop);
  //     variable.rejected(
  //       RuntimeError.circularDependency(variable.cell.name),
  //       variable.promise.version,
  //     );
  //   });
  //
  //   return Promise.resolve(1);
  // }
}

let count = 0;
