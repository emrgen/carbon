import { EventEmitter } from "events";
import { entries, last } from "lodash";
import { SemVer } from "semver";
import { Cell } from "./Cell";
import { Graph } from "./Graph";
import { Module, ModuleNameVersion, ModuleVariableId, ModuleVariableName } from "./Module";
import { Mutable } from "./Mutable";
import { Variable, VariableName } from "./Variable";
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
    if (this.paused) return this;
    this.paused = true;

    this.variablesById.forEach((v) => {
      // just stop all variable computations
      v.stop();
    });

    return this;
  }

  play() {
    if (!this.paused) return this;
    this.paused = false;

    // schedule the dirty variables to be recomputed
    this.schedule();

    return this;
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
    if (variable.removed) return;
    variable.version += 1;
    // console.log("markDirty", variable.name, variable.id, variable.version);
    this.dirty.set(variable.id, variable);
    return this;
  }

  // perform runtime specific actions for a new variable is created
  onCreate(variable: Variable, schedule = true, dirty = true) {
    this.graph.addNode(variable);

    variable.inputs.forEach((input) => {
      this.graph.addEdge(input, variable);
    });

    variable.outputs.forEach((output) => {
      this.graph.addEdge(variable, output);
    });
  }

  // perform runtime specific actions for a variable is removed
  onRemove(variable: Variable) {
    this.graph.removeNode(variable);
  }

  // perform runtime specific actions for a variable is updated
  schedule() {
    if (this.paused) return;

    if (this.dirty.size === 0 && this.generators.size === 0) {
      return;
    }

    const moduleVariables = new Map<string, Variable[]>();
    this.dirty.forEach((variable) => {
      moduleVariables.set(variable.module.id, moduleVariables.get(variable.module.id) || []);
      moduleVariables.get(variable.module.id)!.push(variable);
    });

    this.dirty.clear();
    moduleVariables.forEach((variables, moduleId) => {
      // console.log("SCHEDULE", moduleId, variables.map((v) => v.name));
      this.scheduleModule(variables);
    });
  }

  // schedule a module to be processed
  scheduleModule(variables: Variable[]) {
    const dirty = variables.filter((v) => v.version != v.cell.version);

    // console.log("DIRTY", Array.from(roots.values().map((v) => v.name)));
    const connected = Array.from(this.graph.connected(dirty).values());
    // stops the running nodes from being recomputed further
    // mark all the nodes as pending
    connected.forEach((v) => {
      // if the variable is pending, do not mark it as pending again
      v.stop();
      v.pending();

      const missing = v.dependencies.find((dep) => !v.module.variablesByName.get(dep)?.length);
      if (missing) {
        v.reject(RuntimeError.notDefined(last(missing.split(":"))!));
      }
    });

    const multipleDefinitions = new Set<Variable>();
    connected.map((v) => {
      const variables = v.module.variablesByName.get(v.name);
      if (variables && variables.length > 1) {
        variables?.forEach((v) => {
          multipleDefinitions.add(v);
        });
      }
    });
    // console.log(
    //   connected.length,
    //   "connected variables",
    //   connected.map((v) => v.name),
    // );

    const cycles = this.graph.cycles(variables);
    // console.log(
    //   cycles.length,
    //   "cycles variables",
    //   cycles.map((v) => v.name),
    // );

    // marks the circular dependencies as rejected
    cycles.forEach((variable) => {
      variable.reject(RuntimeError.circularDependency(variable.cell.name));
    });

    console.log(multipleDefinitions.size);
    multipleDefinitions.forEach((variable) => {
      variable.reject(RuntimeError.duplicateDefinition(variable.cell.name));
    });

    // roots can not be in any cycle
    const roots = this.graph.roots(connected);
    const dirtyRoots = new Map<string, Variable>();
    roots.forEach((v) => {
      dirtyRoots.set(v.id, v);
    });

    // marks the unfulfilled builtin variables as roots
    // Array.from(roots.values()).forEach((v) => {
    //   // console.log(
    //   //   "inputs",
    //   //   v.name,
    //   //   v.inputs.map((i) => i.cell.name),
    //   //   v.inputs.map((i) => i.state1),
    //   // );
    //
    //   // if some input is builtin and still not resolved, add the input to roots and remove the current dirty variable
    //   const unresolvedBuiltins = v.inputs.filter((i) => {
    //     return i.cell.builtin && i.state.isUndefined;
    //   });
    //
    //   if (unresolvedBuiltins.length) {
    //     dirtyRoots.delete(v.id);
    //     unresolvedBuiltins.forEach((vi) => {
    //       dirtyRoots.set(vi.name, vi);
    //     });
    //   }
    // });

    // console.log(
    //   "inputs ROOTS",
    //   Array.from(roots.values()).map((v) => v.name),
    // );

    // all connected variables are now pending and have no running computation
    Array.from(dirtyRoots.values()).forEach((root) => {
      console.log(root.dependencies);
      // if the variable is pending, do not mark it as pending again
      return root.compute();
    });
  }
}

let count = 0;
