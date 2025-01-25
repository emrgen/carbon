import { EventEmitter } from "events";
import { find, noop } from "lodash";
import { SemVer } from "semver";
import { Graph } from "./Graph";
import { Module, ModuleNameVersion } from "./Module";
import { Promises } from "./Promises";
import { Promix } from "./Promix";
import { Variable, VariableName } from "./Variable";
import { RuntimeError } from "./x";

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

  promise: Promix<any> = Promix.default("runtime");

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
    this.created.add(variable);

    console.log("=>", variable.id);
    this.graph.addNode(variable);

    variable.inputs.forEach((input) => {
      this.graph.addEdge(input, variable);
    });

    variable.outputs.forEach((output) => {
      this.graph.addEdge(variable, output);
    });

    Promises.delay(0).then(() => this.recompute());
  }

  onRemove(variable: Variable) {
    this.variables.delete(variable.name);
    this.graph.removeNode(variable);
    variable.outputs.forEach((output) => {
      this.dirty.add(output);
    });

    Promises.delay(0).then(() => this.recompute());
  }

  // recompute the dirty variables and their dependencies
  recompute() {
    if (this.dirty.size === 0 && this.created.size === 0) {
      return;
    }

    if (this.computing) {
      this.promise = this.promise.then(() => {
        this.recompute();
      });
      return;
    }

    console.log("----------------\n> recomputing\n----------------");

    console.log(
      "created:",
      Array.from(this.created).map((v) => v.uid),
      "dirty",
      Array.from(this.dirty).map((v) => v.uid),
    );

    // add the created variables to the dirty set
    this.created.forEach((variable) => {
      this.dirty.add(variable);
    });
    this.created.clear();

    const { roots, pending, circular } = this.precompute(Array.from(this.dirty));
    this.dirty.clear();

    console.log(
      "roots",
      roots.map((v) => v.id),
      "pending",
      pending.map((v) => v.id),
      "circular",
      circular.map((v) => v.id),
    );

    this.compute(roots, pending, circular);
  }

  // connect the dirty variables and find out the roots
  precompute(dirty: Variable[]) {
    console.log("----------------\n> precomputing\n----------------");
    this.computing = true;

    const { roots, sorted, circular } = this.graph.topological(dirty);

    this.dirty.clear();

    const pending: Promix<any>[] = [];

    const isRoot = (node) => {
      return find(roots, (root) => root.id === node.id);
    };

    // connect the nodes with the inputs
    // NOTE: computation is not done here
    sorted.forEach((node) => {
      node.promise = node.promise.next(noop);

      if (isRoot(node)) {
        pending.push(node.promise);
        return;
      }

      const inputs = this.graph.inputs(node).map((input) => input.promise);
      console.log(
        node.id,
        this.graph.inputs(node).map((n) => n.id),
      );
      // console.log("before", node.id, node.promise.id);
      // console.log("after", node.id, node.promise.id);

      const fulfilled = (value) => {
        return node.promise.fulfilled(node);
      };
      const done = node.promise
        .all(inputs)
        .then((inputs) => node.compute(inputs))
        .then(() => node.promise.fulfilled(node));
      pending.push(done);

      console.log(
        "connected",
        node.id,
        "<-",
        inputs.map((input) => input.id),
      );
    });

    // then connect the dirty variables
    return {
      roots,
      pending,
      circular,
    };
  }

  // compute the roots
  compute(roots: Variable[], pending: Promix<any>[], circular: Variable[]) {
    console.log("----------------\n> compute\n----------------");
    this.computing = true;

    // if there are circular dependencies, mark them with error
    circular.forEach((variable) => {
      console.log("circular", variable.id);
      variable.rejected(RuntimeError.circularDependency(variable.id));
      variable.promise.rejected(variable.error);
    });

    // fulfill the roots with the computed inputs, if no
    roots.forEach((root) => {
      console.log("root", root.id);
      const inputs = this.graph.inputs(root).map((input) => input.promise);
      Promix.all(inputs)
        .then((inputs) => root.compute(inputs))
        .then((_) => {
          return root.promise.fulfilled(root);
        });
    });

    this.promise = this.promise.all(pending).then(() => {
      this.computing = false;
      this.postcompute();
    });
  }

  // if there were generators, run them
  postcompute() {
    Promises.delay(0).then(() => {
      console.log("----------------\n> postcompute\n----------------");
      if (this.generators.size) {
        console.log("running generators");
        this.generate();
        // Promises.delay(0).then(() => this.recompute());
      }
    });
  }

  generate() {
    console.log(this.graph.outgoing)
    const { roots, pending, circular } = this.precompute(Array.from(this.generators));
    this.generators.clear();
    roots.forEach((v) => {
      v
        .generateNext()
        ?.then(v.fulfilled)
        .then((_) => {
          v.promise.fulfilled(v);
        });
    });

    console.log("pending", pending.map(p => p.id))

    this.promise.all(pending).then(() => {
      this.computing = false;
      this.postcompute();
    });

    // const {} = this.compute(roots, sorted, circular);
  }
}
