import { last, noop } from "lodash";
import { Cell } from "./Cell";
import { Module, ModuleVariableId, ModuleVariableName } from "./Module";
import { Promised } from "./Promised";
import { Promix } from "./Promix";
import { generatorish, randomString, RuntimeError } from "./x";

export type VariableName = string;
export type VariableId = string;

const noopPromix = Promix.default("noop");

const LOG = 0;

interface VariableProps {
  module: Module;
  cell: Cell;
}

enum VariableState {
  UNDEFINED = "undefined",
  DETACHED = "detached", // removed variable, but not deleted from the module
  SCHEDULED = "scheduled", // scheduled for computation, but not yet computed
  PENDING = "pending", // computation is in progress, inputs are not yet fulfilled
  FULFILLED = "fulfilled",
  REJECTED = "rejected",
}

export const UNDEFINED_VALUE = Symbol("undefined");

// reactive variable
export class Variable {
  // parent module
  module: Module;

  // encapsulated a variablesById definition
  cell: Cell;

  // this has higher priority than the connection in the graph
  // this are updated when the variable is created, redefined or deleted
  // runtime graph is updated based on these variablesById
  inputs: Variable[] = [];
  outputs: Variable[] = [];

  // promise that resolves when the variable calculation is done
  // the calculation is done when all inputs are fulfilled
  // the calculation can result in an error or a value
  promise: Promised;
  error: RuntimeError | undefined;
  value: any = UNDEFINED_VALUE;
  // this is mainly for debugging purposes
  state: VariableState;

  // runs the generator in the background
  runner: Promised;
  // similar to done channel in go, one done is set the runner stop running the generator
  done = false;

  // if the variable is a generator
  generator: { next: Function; return: Function } = { next: noop, return: noop };
  generated: any = undefined;
  generatorish: boolean = false;

  // version of the variable calculation
  fulfilledVersion: number = -1;
  rejectedVersion: number = -1;
  pendingVersion: number = -1;

  static create(props: VariableProps) {
    return new Variable(props);
  }

  static randomName() {
    return `unnamed_${randomString(10)}`;
  }

  static id(moduleId: string, variableId: string): ModuleVariableId {
    return `${moduleId}/${variableId}`;
  }

  // full name of the variable in the format moduleId:variableName
  static fullName(moduleId: string, variableName: string): ModuleVariableName {
    return `${moduleId}:${variableName}`;
  }

  constructor(props: VariableProps) {
    const { module, cell } = props;
    this.module = module;

    // update the cell deps with module id
    this.cell = cell.with(module);

    this.state = VariableState.UNDEFINED;

    this.promise = Promised.create(noop, this.id);
    this.runner = Promised.create(noop, this.id);

    this.pending = this.pending.bind(this);
    this.fulfilled = this.fulfilled.bind(this);
    this.rejected = this.rejected.bind(this);

    this.compute = this.compute.bind(this);
    this.stop = this.stop.bind(this);
    this.onProgress = this.onProgress.bind(this);

    this.generateFirst = this.generateFirst.bind(this);
    this.generateNext = this.generateNext.bind(this);
  }

  get cellId() {
    return this.cell.id;
  }

  get id() {
    return Variable.id(this.module.id, this.cell.id);
  }

  get version() {
    return this.cell.version;
  }

  set version(version: number) {
    this.cell.version = version;
  }

  get name() {
    return Variable.fullName(this.module.id, this.cell.name);
  }

  get dependencies() {
    return this.cell.dependencies;
  }

  get builtin() {
    return this.cell.builtin;
  }

  get runtime() {
    return this.module.runtime;
  }

  redefine(cell: Cell) {
    this.cell = cell.with(this.module);
  }

  // break all links before leaving
  // set the definition to noop
  delete(props?: { module: boolean }) {
    if (!props?.module) {
      this.module.delete(this.id);
      return;
    }

    this.redefine(
      Cell.create({
        id: this.id,
        name: Variable.randomName(),
        version: this.version + 1,
      }),
    );
  }

  // on compute is called when the variable is computed,
  onProgress() {
    if (this.promise.isFulfilled) {
      const cycle = this.findAllNodesInCycle();
      if (cycle.length > 0) {
        cycle.forEach((node) => {
          node.rejected(RuntimeError.circularDependency(this.cell.name));
        });
        return;
      }

      // console.log(this.id, this.name);
      const outputs = this.outputs;
      outputs.forEach((output) => {
        const inputs = output.inputs;
        // check for cycles in the output paths

        // if all inputs are fulfilled, run the output variable
        if (inputs.every((input) => input.promise.isFulfilled)) {
          output.pending();
          output.stop();
          // console.log("onProgress", this.id, this.name, "value:", this.value);
          // console.log(
          //   "output",
          //   output.id,
          //   output.name,
          //   "inputs:",
          //   inputs.map((i) => i.name),
          // );
          output.compute(inputs);
        }
      });
    } else if (this.promise.isRejected) {
      // if the promise is rejected, we need to stop the generator
      // and mark the variable as rejected
      this.stop();

      this.outputs.forEach((output) => {
        output.stop();
        output.pending();
        output.rejected(this.error || RuntimeError.of("Variable computation failed"));
      });
    }
  }

  findAllNodesInCycle() {
    const visited = new Set<Variable>();
    const stack = new Set<Variable>();
    const cycle: Variable[] = [];

    const dfs = (node: Variable) => {
      if (stack.has(node)) {
        cycle.push(node);
        return true; // cycle found
      }
      if (visited.has(node)) {
        return false; // already visited
      }

      visited.add(node);
      stack.add(node);

      for (const input of node.inputs) {
        if (dfs(input)) {
          return true; // cycle found in the input path
        }
      }

      stack.delete(node);
      return false; // no cycle found in this path
    };

    dfs(this);

    return cycle;
  }

  // stop the variable computation, stop the generator if it is a generator
  stop() {
    if (this.generatorish) {
      this.done = true;
      this.runner.fulfilled({ value: this.generated, cmd: "done" });
      const done = () => ({ value: this.value, done: true });
      this.generator = { next: done, return: done };
      console.log("--------------------------------", this.value);
    } else {
      // cache the last computed value
      this.promise.fulfilled(this.value);
    }
  }

  // force recompute the variable
  recompute() {
    this.version += 1;
    this.runtime.markDirty(this);
    this.runtime.schedule();
  }

  // compute the variable value from inputs
  // if the variable is a generator,
  // run the generator once,
  // the first run will mark the generator as dirty,
  // triggering the runtime to compute it again
  compute(inputs: Variable[]) {
    // console.log("computing:", this.id, "=>", this.name);

    // ensure all inputs are fulfilled
    const error = inputs.find((input) => input.error);
    if (error) {
      this.rejected(error.error!);
      return;
    }

    const inputMap = new Map(inputs.map((input) => [input.name, input]));
    // console.log(inputs.map((input) => input));

    // make sure the input variablesById have matching names
    const missing = this.dependencies.find((name, i) => !inputMap.has(name));
    if (missing) {
      return Promise.reject(RuntimeError.notDefined(last(missing.split(":"))!)).catch(
        this.rejected,
      );
    }

    // get the input variable values in order by name
    const deps = this.dependencies.map((name) => inputMap.get(name)).filter(Boolean) as Variable[];
    if (deps.length !== this.dependencies.length) {
      return Promix.reject(RuntimeError.of(`Variable ${this.cell.name} has missing dependencies`));
    }

    // get the values of the input variablesById
    const args = deps.map((input) => input.value);

    // if any of the input variablesById is undefined, skip the computation
    if (args.some((arg) => arg === UNDEFINED_VALUE)) {
      // this.pending();
      return;
    }

    try {
      const res = this.cell.definition.bind(this)(...args);
      // console.log(res);
      Promise.resolve(res).then(this.generateFirst).then(this.fulfilled).catch(this.rejected);
    } catch (error) {
      this.rejected(error as Error);
    }
  }

  // run the generator once and save the value at the generated field
  private generateFirst(value: any) {
    if (generatorish(value)) {
      // console.log("generateFirst", value);
      this.generatorish = true;
      this.generator = value;
      return this.generate();
    } else {
      this.generatorish = false;
    }

    return value;
  }

  // run the generator next and save the value at the generated field
  private generateNext() {
    try {
      this.version += 1;
      // create a new promise for the current run.
      this.promise = Promised.create(noop, this.id, UNDEFINED_VALUE);
      return this.generate()
        .then((v) => {
          console.log("--->", v);
          this.fulfilled(v);
        })
        .catch(this.rejected);
    } catch (e) {
      return Promise.reject(e).catch(this.rejected);
    }
  }

  // run the generator once and save the value at the generated field
  private generate() {
    return Promise.resolve(this.generator.next(this.generated))
      .then(({ value, done }) => {
        if (value === undefined) {
          debugger;
        }
        return Promise.resolve(value)
          .then((v) => {
            if (v != undefined) {
              this.runner.fulfilled(v);
            }

            if (done) {
              // just adding a promise over the value just in case generator returns a promise
              this.done = true;
              if (value !== undefined) {
                this.generated = v;
              }
              return this.generated;
            } else {
              // console.log("generateNext", this.name, this.cell.definition.toString(), v, done);
              // if the generator is not done, we need to run it again
              // run the generator again after a short delay, without blocking the event loop
              // without this, the generator will run as fast as possible, hanging the event loop
              const clear = setTimeout(() => this.generateNext(), 1);

              this.runner = Promised.create(noop, this.id).then(({ value, done }) => {
                clearTimeout(clear);
                if (done) {
                  this.done = true;
                  return (this.generated = value);
                } else {
                  return this.generateNext();
                }
              });

              return (this.generated = v);
            }
          })
          .catch(this.rejected);
      })
      .catch(error);
  }

  pending() {
    this.state = VariableState.PENDING;
    this.pendingVersion = this.version;

    // this.promise.fulfilled(""); // fulfill the promise with an empty value
    // create a new promise for the next run
    this.promise = Promised.create(noop, this.id, UNDEFINED_VALUE);
    this.state = VariableState.PENDING;
    this.value = UNDEFINED_VALUE;
    this.error = undefined;
    const done = () => ({ value: this.value, done: true });
    this.generator = { next: done, return: done };
    this.runtime.emit("pending", this);
    this.runtime.emit("pending:" + this.cellId, this);
    // this.onProgress();
    return this;
  }

  // mark the variable as fulfilled with a value
  private fulfilled(value: any) {
    this.state = VariableState.FULFILLED;
    // console.log(this.id, "fulfilled", this.name, "value:", value);

    const variable = this.runtime.variablesById.get(this.id);
    // TODO: check if this is working correctly
    // if (this.version === this.fulfilledVersion) {
    //   return variable;
    // }

    console.log(this.id, "value", value, this.builtin);
    this.fulfilledVersion = this.version;
    this.value = value;
    this.error = undefined;
    this.promise.fulfilled(value);
    !this.builtin && this.runtime.emit("fulfilled", this);
    !this.builtin && this.runtime.emit("fulfilled:" + this.cellId, this);
    this.onProgress();
    return this;
  }

  // mark the variable as rejected with an error
  rejected(error: Error) {
    const variable = this.runtime.variablesById.get(this.id);
    // if (this.version === this.rejectedVersion) {
    //   return variable;
    // }

    this.rejectedVersion = this.version;
    this.error = error;
    this.value = undefined;
    this.generator = { next: noop, return: noop };
    // this.promise.rejected(error)
    // console.log("rejected", this.id, this.name, error);
    this.runtime.emit("rejected", this);
    this.runtime.emit("rejected:" + this.cellId, this);
    this.onProgress();
    return this;
  }

  removed() {
    this.value = UNDEFINED_VALUE;
    this.error = undefined;
    this.state = VariableState.UNDEFINED;
    this.generator = { next: noop, return: noop };
    !this.builtin && this.runtime.emit("removed", this);
    !this.builtin && this.runtime.emit("removed:" + this.cellId, this);
  }
}

function error(e) {
  console.log(e);
}
