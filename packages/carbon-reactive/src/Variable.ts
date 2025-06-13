import { last, noop } from "lodash";
import { Cell } from "./Cell";
import { Module, ModuleVariableId, ModuleVariableName } from "./Module";
import { Promix } from "./Promix";
import { generatorish, randomString, RuntimeError } from "./x";

export type VariableName = string;
export type VariableId = string;

const noopPromix = Promix.default("noop");

const LOG = 0;

const NOOP_GENERATOR = {
  next: (value: any) => ({ value: UNDEFINED_VALUE, done: true }),
  return: () => ({ value: UNDEFINED_VALUE, done: true }),
  // throw: () => ({ value: NOOP_GENERATOR, done: false }),
  // [Symbol.iterator]: () => NOOP_GENERATOR,
};

export const UNDEFINED_VALUE = Symbol("undefined");

export enum State {
  UNDEFINED = "undefined",
  DETACHED = "detached", // removed variable, but not deleted from the module
  STOPPED = "stopped", // computation is stopped, inputs are fulfilled, but not yet computed
  PENDING = "pending", // computation is in progress, inputs are not yet fulfilled
  PAUSED = "paused", // computation is paused, inputs are fulfilled, but not yet computed
  PROCESSING = "processing", // scheduled for computation, but not yet computed
  FULFILLED = "fulfilled",
  REJECTED = "rejected",
}

class VariableState {
  value: State;

  static undefined = new VariableState(State.UNDEFINED);
  static detached = new VariableState(State.DETACHED);
  static pending = new VariableState(State.PENDING);
  static paused = new VariableState(State.PAUSED);
  static stopped = new VariableState(State.STOPPED);
  static processing = new VariableState(State.PROCESSING);
  static fulfilled = new VariableState(State.FULFILLED);
  static rejected = new VariableState(State.REJECTED);

  constructor(value: State) {
    this.value = value;
  }

  get isStopped() {
    return this.value === State.STOPPED;
  }

  get isUndefined() {
    return this.value === State.UNDEFINED;
  }

  get isPending() {
    return this.value === State.PENDING;
  }

  get isPaused() {
    return this.value === State.PAUSED;
  }

  get isDetached() {
    return this.value === State.DETACHED;
  }

  get isProcessing() {
    return this.value === State.PROCESSING;
  }

  get isFulfilled() {
    return this.value === State.FULFILLED;
  }

  get isRejected() {
    return this.value === State.REJECTED;
  }
}

interface VariableProps {
  module: Module;
  cell: Cell;
}

// reactive variable
export class Variable {
  // parent module
  module: Module;

  // encapsulated a variablesById definition
  cell: Cell;

  version: number = 0;

  // if the variable is connected to the graph
  removed: boolean = false;

  // this has higher priority than the connection in the graph
  // this are updated when the variable is created, redefined or deleted
  // runtime graph is updated based on these variablesById
  inputs: Variable[] = [];
  outputs: Variable[] = [];

  state: VariableState;

  // promise that resolves when the variable calculation is done
  // the calculation is done when all inputs are fulfilled
  // the calculation can result in an error or a value
  promise: Promise<any>;
  // resolve and reject functions for the promise
  resolve: (value: any) => void = noop;
  reject: (error: Error) => void = noop;

  error: RuntimeError | undefined;
  value: any = UNDEFINED_VALUE;

  // if the variable is a generator
  private generator = NOOP_GENERATOR;
  private generating: boolean = false;
  private controller: AbortController;

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

    this.state = VariableState.undefined;

    this.controller = new AbortController();

    this.pending = this.pending.bind(this);
    this.fulfilled = this.fulfilled.bind(this);
    this.rejected = this.rejected.bind(this);

    this.compute = this.compute.bind(this);
    this.stop = this.stop.bind(this);

    this.promise = Variable.createPromise(this);
  }

  private static createPromise(variable: Variable) {
    return (variable.promise = new Promise((y, n) => {
      variable.resolve = y;
      variable.reject = n;
    }).then(variable.fulfilled, variable.rejected));
  }

  get cellId() {
    return this.cell.id;
  }

  get id() {
    return Variable.id(this.module.id, this.cell.id);
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

  get emitter() {
    return this.module.runtime;
  }

  // break all links before leaving
  // set the definition to noop
  delete(props?: { module: boolean }) {
    if (!props?.module) {
      this.module.delete(this.id);
      return;
    }

    this.state = VariableState.detached;
    this.removed = true;
    this.generator = NOOP_GENERATOR;
    this.value = UNDEFINED_VALUE;
    this.error = undefined;
  }

  // force play the variable
  play() {
    this.module.recompute(this.name);
  }

  // stop the variable computation, stop the generator if it is a generator
  // NOTE: variable computation can still happen if the inputs are fulfilled
  stop() {
    this.state = VariableState.stopped;
    if (this.generating) {
      this.stopGenerating();
    } else {
      // cache the last computed value
      this.resolve(this.value);
    }
  }

  // scheduled for computation
  pending() {
    console.log("pending", this.id, this.name);

    this.promise = Variable.createPromise(this);

    this.state = VariableState.pending;

    this.emitter.emit("pending", this);
    this.emitter.emit("pending:" + this.cellId, this);

    return this;
  }

  // mark the variable as processing
  processing() {
    // console.log("processing", this.id, this.name);

    this.state = VariableState.processing;
    this.emitter.emit("processing", this);
    this.emitter.emit("processing:" + this.cellId, this);

    return this;
  }

  // update state for removed variable
  detach() {
    console.log("removed", this.id, this.name);
    this.removed = true;

    this.state = VariableState.detached;
    this.value = UNDEFINED_VALUE;
    this.error = undefined;

    this.generator = NOOP_GENERATOR;

    !this.builtin && this.emitter.emit("removed", this);
    !this.builtin && this.emitter.emit("removed:" + this.cellId, this);
  }

  // compute the variable value from inputs
  // if the variable is a generator,
  // run the generator once,
  // the first run will mark the generator as dirty,
  // triggering the runtime to compute it again
  compute() {
    if (this.removed) {
      console.warn("Variable is removed, cannot compute", this.id, this.name);
      return;
    }

    console.log("computing:", this.id, "=>", this.name);
    this.processing();

    for (const dep of this.dependencies) {
      const deps = this.module.variablesByName.get(dep) ?? [];
      if (deps.length > 1) {
        this.reject(RuntimeError.duplicateDefinition(last(dep.split(":"))!));
        return;
      }

      if (deps.length === 0) {
        this.reject(RuntimeError.notDefined(last(dep.split(":"))!));
        return;
      }
    }

    const inputs = this.inputs;

    // ensure all inputs are fulfilled
    const error = inputs.find((input) => input.error);
    if (error) {
      this.reject(RuntimeError.notDefined(error.cell.name));
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
      // Promise.resolve(res).then(this.generateFirst).then(this.fulfilled).catch(this.rejected);
      Promise.resolve(res).then((res) => {
        // start the generator if it is a generator
        if (generatorish(res)) {
          this.generator = res;
          this.generating = true;
          this.startGenerating();
        } else {
          // console.log("fulfilled", this.id, this.name, res);
          this.state = VariableState.fulfilled;
          this.resolve(res);
        }
      });
    } catch (error) {
      this.state = VariableState.rejected;
      this.reject(error as Error);
    }
  }

  private async startGenerating() {
    const signal = (this.controller = new AbortController()).signal;
    let generator = this.generator;
    let generated: any = undefined;
    // console.log("startGenerating", this.id, this.name, generator);

    let done = false;
    let error: any = null;
    let i = 0;
    while (!done && !signal.aborted && !error) {
      await new Promise((proceed, failed) => {
        // debugger;
        setTimeout(() => {
          this.promise = Variable.createPromise(this);
          try {
            Promise.resolve(generator.next(generated))
              .then(({ value, done: isDone }) => {
                // NOTE: the promise is not associated with the generated value anymore.
                // console.log("generated", i++, this.id, this.name, value, isDone);
                if (isDone) {
                  done = true;
                  generated = value;
                } else {
                  // console.log("generator next", this.name, value, isDone);
                  generated = value;
                  // continue the generator
                }

                this.processing();
                this.resolve(value);
                proceed(value);
              })
              .catch((e) => {
                this.reject(e as Error);
                failed(e);
                error = e;
              });
          } catch (e) {
            this.reject(e as Error);
            failed(e);
            error = e;
          }
        }, 0);
      });
    }

    this.generating = false;
  }

  // this method exists only for clean semantics
  private stopGenerating() {
    this.controller.abort();
  }

  // mark the variable as fulfilled with a value
  private fulfilled(value: any) {
    // if (this.state.isStopped) return;
    if (this.state.isDetached) return;
    console.log(this.id, "fulfilled", this.name, "value:", value, "state:", this.state);
    // this.state = VariableState.fulfilled;
    this.value = value;
    this.error = undefined;
    !this.builtin && this.emitter.emit("fulfilled", this);
    !this.builtin && this.emitter.emit("fulfilled:" + this.cellId, this);
    this.onSuccess();

    return this;
  }

  // mark the variable as rejected with an error
  private rejected(error: Error) {
    // if (this.state.isStopped || this.state.isPending) return;
    if (this.state.isDetached) return;
    console.log("rejected", this.id, this.name, error.toString());
    // this.state = VariableState.rejected;
    this.error = error;
    this.value = undefined;
    this.generator = NOOP_GENERATOR;
    this.emitter.emit("rejected", this);
    this.emitter.emit("rejected:" + this.cellId, this);
    this.onError();
    return this;
  }

  // on compute is called when the variable is computed,
  onSuccess() {
    // if (this.removed) return;
    if (this.state.isFulfilled) {
      console.log("onProgress", this.id, this.name, "state:", this.state.value, this.value);
      const cycle = this.findAllNodesInCycle();
      if (cycle.length > 0) {
        cycle.forEach((node) => {
          node.reject(RuntimeError.circularDependency(this.cell.name));
        });
        return;
      }

      console.log(this.id, this.name);
      const outputs = this.outputs;
      outputs.forEach((output) => {
        if (output.removed) return;
        const inputs = output.inputs;
        // check for cycles in the output paths

        console.log(inputs.map((input) => input.state));
        console.log(inputs.map((input) => input.cell.version));
        // if all inputs are fulfilled, run the output variable
        if (inputs.every((input) => input.state.isFulfilled)) {
          console.log("compute child", this.id, "=>", output.id, output.name);
          output.stop();
          output.pending();
          output.compute();
        }
      });
    }
  }

  onError() {
    this.stop();

    this.outputs.forEach((output) => {
      output.stop();
      output.pending();
      output.compute();
    });
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
}

function error(e) {
  console.log(e);
}
