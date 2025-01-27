import { EventEmitter } from "events";
import { entries, find, noop } from "lodash";
import { SemVer } from "semver";
import { Cell } from "./Cell";
import { Graph } from "./Graph";
import { Module, ModuleNameVersion, ModuleVariableId, ModuleVariableName } from "./Module";
import { Mutable } from "./Mutable";
import { Promises } from "./Promises";
import { Promix } from "./Promix";
import { Variable, VariableName } from "./Variable";
import { RuntimeError } from "./x";

interface Builtins {
  [name: string]: any;
}

const LOG = 0;

// Think a whole notebook as a runtime.
export class Runtime extends EventEmitter {
  id: string;
  version: SemVer;

  // each variable refresh updates the version
  clock: number = 0;

  graph: Graph<Variable>;

  // save the module using moduleName@version as key
  modules: Map<ModuleNameVersion, Module> = new Map();

  // one module may have variable with same name
  variables: Map<ModuleVariableId, Variable> = new Map();

  // generated from variables map
  moduleVariables: Map<ModuleVariableName, Variable[]> = new Map();

  // variables that are dirty and need to be recomputed
  dirty: Set<Variable> = new Set();

  // generators that are dirty and need to be recomputed
  generators: Set<Variable> = new Set();

  builtin: Module;
  builtinVariables: Map<VariableName, Variable> = new Map();

  // mutable variables store
  mutable: Mutable;

  computing: boolean = false;

  promise: Promix<any> = Promix.default("runtime");

  static create(id: string, version: string, builtins?: Builtins) {
    return new Runtime(id, version, builtins);
  }

  constructor(id: string, version: string, builtins: Builtins = {}) {
    super();
    this.id = id;
    this.version = new SemVer(version);
    this.graph = new Graph();
    this.mutable = new Mutable(this);

    const mod = Module.create(this, "mod:builtinId", "mod:builtinName", "0.0.1");

    // create builtins variables
    entries(builtins).forEach(([name, value]) => {
      const cell = Cell.create({
        id: "builtin/" + name,
        name,
        code: `() => ${value}`,
        definition: () => value,
        builtin: true,
      });

      const variable = mod.define(cell);
      variable.fulfilled(value);

      this.builtinVariables.set(name, variable);
    });

    this.builtin = mod;
  }

  variable(id: string) {
    return this.variables.get(id);
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

    // import the builtins from the runtime
    this.builtinVariables.forEach((variable) => {
      mod.import(variable.cell.name, variable.cell.name, this.builtin);
    });

    return mod;
  }

  onCreate(variable: Variable) {
    this.variables.set(variable.id, variable);
    this.moduleVariables.set(variable.name, this.moduleVariables.get(variable.name) || []);
    this.moduleVariables.get(variable.name)!.push(variable);

    this.dirty.add(variable);

    LOG && console.log("=>", variable.id);
    this.graph.addNode(variable);

    variable.inputs.forEach((input) => {
      this.graph.addEdge(input, variable);
    });

    variable.outputs.forEach((output) => {
      this.graph.addEdge(variable, output);
    });

    this.tryRecompute();
  }

  onRemove(variable: Variable) {
    this.variables.delete(variable.name);
    // if there were multiple variable with same name they become dirty
    const variables = this.moduleVariables.get(variable.name);
    if (variables) {
      const remaining = variables.filter((v) => v.id !== variable.id);
      this.moduleVariables.set(variable.name, remaining);
      remaining.forEach((v) => {
        this.dirty.add(v);
      });
    }

    this.graph.removeNode(variable);
    variable.outputs.forEach((output) => {
      this.dirty.add(output);
    });

    variable.inputs.forEach((input) => {
      if (input.promise.isPending) {
        this.dirty.add(input);
      }
    });

    this.tryRecompute();
  }

  tryRecompute() {
    if (this.dirty.size === 0 && this.generators.size === 0) return;
    LOG &&
      console.log(
        "try dirty",
        Array.from(this.dirty).map((v) => v.id + " " + v.cell.code),
      );

    Promises.delay(0).then(() => {
      if (this.computing) {
        console.log("not computing", this.computing);
        this.tryRecompute();
      } else {
        this.generate().then(() => this.recompute());
      }
    });
  }

  // recompute the dirty variables and their dependencies
  recompute() {
    LOG && console.log("----------------\n> recomputing\n----------------");
    if (this.dirty.size === 0) {
      // if no dirty variables tryRecompute (to process pending generators)
      this.tryRecompute();
      return;
    }

    this.computing = true;

    LOG &&
      console.log(
        "dirty",
        Array.from(this.dirty).map((v) => v.id),
      );

    const { roots, pending, sorted, circular } = this.precompute(Array.from(this.dirty));
    this.dirty.clear();

    LOG &&
      console.log(
        "roots",
        roots.map((v) => v.id),
        "pending",
        pending.map((v) => v.id),
        "circular",
        circular.map((v) => v.id),
      );

    this.compute(roots, sorted, circular, pending);
  }

  // connect the dirty variables and find out the roots
  precompute(dirty: Variable[]) {
    LOG && console.log("----------------\n> precomputing\n----------------");
    const { roots, sorted, circular } = this.graph.topological(dirty);

    const pending: Promix<any>[] = [];

    const isRoot = (node) => {
      return find(roots, (root) => root.id === node.id);
    };

    // connect the nodes with the inputs
    // NOTE: computation is not done here
    sorted.forEach((variable) => {
      // if the variable is pending from previous computation, reject it
      if (variable.promise.isPending) {
        variable.rejected(RuntimeError.recalculating(variable.name), variable.promise.version);
      }
      variable.promise = variable.promise.next(noop);

      if (isRoot(variable)) {
        pending.push(variable.promise);
        return;
      }

      const inputs = this.graph.inputs(variable).map((input) => input.promise);
      // console.log("before", node.id, node.promise.id);
      // console.log("after", node.id, node.promise.id);

      // const fulfilled = (value) => {
      //   return node.promise.fulfilled(node);
      // };

      const done = variable.promise.all(inputs).then((v) => {
        return variable.compute(v, variable.promise.version);
      });
      pending.push(done);

      LOG &&
        console.log(
          "connected:",
          variable.id,
          "<-",
          inputs.map((input) => input.id),
        );
    });

    // pending.forEach((p) => {
    //   const v = this.variable(p.id);
    //   if (!v) return;
    //   v.promise = p;
    // });

    // then connect the dirty variables
    return {
      roots,
      pending,
      sorted,
      circular,
    };
  }

  // compute the roots
  compute(roots: Variable[], sorted: Variable[], circular: Variable[], pending: Promix<any>[]) {
    LOG && console.log("----------------\n> compute\n----------------");

    sorted.forEach((p) => p.pending());

    // if there are circular dependencies, mark them with error
    circular.forEach((variable) => {
      // console.log("circular", variable.id);
      variable.promise = variable.promise.next(noop);
      variable.rejected(RuntimeError.circularDependency(variable.name), variable.promise.version);
    });

    // find conflicting names
    const names = sorted.reduce((acc, v) => {
      if (!acc.has(v.name)) {
        acc.set(v.name, []);
      }

      acc.get(v.name)!.push(v);
      return acc;
    }, new Map<string, Variable[]>());

    // if there are conflicting names, mark them with error
    names.forEach((vs) => {
      if (vs.length > 1) {
        vs.forEach((v) => {
          v.rejected(RuntimeError.duplicateDefinition(v.cell.name), v.promise.version);
        });
        roots.splice(roots.indexOf(vs[0]), 1);
      }
    });

    // fulfill the roots with the computed inputs, if no
    roots.forEach((root) => {
      const inputs = this.graph.inputs(root).map((input) => input.promise);
      Promix.all(inputs).then((v) => {
        return root.compute(v, root.promise.version);
      });
    });

    // this will allow next recompute to begin even before the current one is finished
    this.computing = false;

    LOG &&
      console.log(
        "pending",
        pending.map((p) => p.id),
      );

    Promise.all(pending).then(() => {
      this.tryRecompute();
    });
  }

  generate() {
    LOG && console.log("----------------\n> generate\n----------------");
    if (this.generators.size === 0) {
      return Promise.resolve();
    }

    this.computing = true;

    LOG &&
      console.log(
        "generators",
        Array.from(this.generators).map((v) => v.id),
      );
    const { roots, pending, circular } = this.precompute(Array.from(this.generators));
    this.generators.clear();

    roots.forEach((variable) => {
      variable.generateNext();
    });

    circular.forEach((variable) => {
      variable.promise = variable.promise.next(noop);
      variable.rejected(RuntimeError.circularDependency(variable.name), variable.promise.version);
    });

    return Promix.all(pending).then(() => {
      this.computing = false;
    });
  }
}
