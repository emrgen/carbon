import { last, noop } from "lodash";
import { Cell } from "./Cell";
import { Module, ModuleVariableId, ModuleVariableName } from "./Module";
import { generatorish, randomString, RuntimeError } from "./x";

export type VariableName = string;
export type VariableId = string;

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
  COMPUTING = "computing", // scheduled for computation, but not yet computed
  PROCESSING = "processing", // scheduled for computation, but not yet computed
  GENERATING = "generating", // generator is running, inputs are fulfilled, but not yet computed
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
  static computing = new VariableState(State.COMPUTING); // computing from inputs, but not yet fulfilled
  static generating = new VariableState(State.GENERATING); // computing within a generator
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

  get isDetached() {
    return this.value === State.DETACHED;
  }

  get isProcessing() {
    return this.value === State.PROCESSING;
  }

  get isComputing() {
    return this.value === State.COMPUTING;
  }

  get isGenerating() {
    return this.value === State.GENERATING;
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

interface Invalidation {
  resolve: (v: any) => void;
  reject: (e: Error) => void;
  promise: Promise<unknown>;
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
  // resolve will call fulfilled to notify the variable is computed
  resolve: (value: any) => void = noop;
  // reject will call rejected to notify the variable is rejected
  reject: (error: Error) => void = noop;

  error: RuntimeError | undefined;
  value: any = UNDEFINED_VALUE;

  // if the variable is a generator
  private generator = NOOP_GENERATOR;
  private controller: AbortController;

  private invalidation!: Invalidation;

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

  static visibleName(name: string): string {
    return last(name.split(":"))!;
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

    this.invalidation = Variable.createInvalidation();
    this.promise = Variable.createPromise(this);
  }

  // unwrap a promise onto a invalidation object
  private static createInvalidation() {
    let _resolve: (v: any) => void = noop;
    let _reject: (e: Error) => void;
    const invalidation: Invalidation = {
      resolve: () => {},
      reject: () => {},
      promise: new Promise((resolve, reject) => {
        _resolve = resolve;
        _reject = reject;
      }),
    };

    invalidation.resolve = _resolve!;
    invalidation.reject = _reject!;

    return invalidation;
  }

  private static createPromise(variable: Variable) {
    variable.invalidation.resolve(Math.random());
    variable.invalidation = Variable.createInvalidation();

  // unwrap a promise onto the variable
    const promise = new Promise((y, n) => {
      variable.resolve = y;
      variable.reject = n;
    }).then(variable.fulfilled, variable.rejected);

    return promise;
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
      this.module.delete(this.cell.id);
      return;
    }

    this.state = VariableState.detached;
    this.removed = true;
    this.generator = NOOP_GENERATOR;
    this.value = UNDEFINED_VALUE;
    this.error = undefined;
    this.invalidation.resolve(Math.random());
    this.cell.dispose();
  }

  // force play the variable
  play() {
    if (this.state.isDetached) {
      console.warn("Variable is detached, cannot play", this.id, this.name);
      return;
    }
    this.module.recompute(this.name);
  }

  // stop the variable computation, stop the generator if it is a generator
  // NOTE: variable computation can still happen if the inputs are fulfilled
  stop() {
    if (this.state.isUndefined) return;
    this.state = VariableState.stopped;

    // if the variable is a generator, abort the controller
    if (this.generator) {
      this.controller.abort();
    } else {
      // cache the last computed value
      this.resolve(this.value);
    }
  }

  // scheduled for computation
  pending() {
    // console.log("pending", this.id, this.name);
    this.promise = Variable.createPromise(this);

    this.state = VariableState.pending;

    this.emitter.emit("pending", this);
    this.emitter.emit("pending:" + this.cellId, this);

    return this;
  }

  // mark the variable as processing
  computing() {
    this.state = VariableState.computing;
    this.emitter.emit("computing", this);
    this.emitter.emit("computing:" + this.cellId, this);

    return this;
  }

  generating() {
    this.state = VariableState.generating;
    this.emitter.emit("generating", this);
    this.emitter.emit("generating:" + this.cellId, this);

    return this;
  }

  // mark the variable as processing
  processing() {
    this.emitter.emit("processing", this);
    this.emitter.emit("processing:" + this.cellId, this);

    return this;
  }

  // update state for removed variable
  detach() {
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
    if (this.state.isDetached) {
      console.warn("Variable is removed, cannot compute", this.id, this.name);
      return;
    }

    // console.log("computing:", this.id, "=>", this.name);
    const inputNames = this.dependencies.filter((d) => d !== "invalidation");

    for (const dep of inputNames) {
      if (dep === "invalidation") continue;
      const deps = this.module.variablesByName.get(dep) ?? [];
      if (deps.length > 1) {
        this.reject(RuntimeError.duplicateDefinition(dep));
        return;
      }

      if (deps.length === 0) {
        this.reject(RuntimeError.notDefined(dep));
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

    // make sure the input variablesById have matching names
    const missing = inputNames.find((name, i) => !inputMap.has(name));
    if (missing) {
      this.reject(RuntimeError.notDefined(missing));
      return;
    }

    // get the input variable values in order by name
    const deps = inputNames.map((name) => inputMap.get(name)).filter(Boolean) as Variable[];
    if (deps.length !== inputNames.length) {
      return this.reject(RuntimeError.of(`Variable ${this.cell.name} has missing dependencies`));
    }

    // get the values of the input variablesById
    const args = this.dependencies.map((name) => {
      // invalidation is a per variable deps that resolves when the varable is deleted
      if (name === "invalidation") return this.invalidation.promise;
      return inputMap.get(name)?.value;
    }) as any[];

    // if any of the input variablesById is undefined, skip the computation
    if (args.some((arg) => arg === UNDEFINED_VALUE)) {
      // this.pending();
      return;
    }

    try {
      const result = this.cell.definition.bind(this)(...args);

      this.processing();
      Promise.resolve(result)
        .then((res) => {
          // console.log("computed:", this.id, "=>", this.name, res, this.value);
          // start the generator if it is a generator
          if (generatorish(res)) {
            this.state = VariableState.generating;
            this.generator = res;
            this.startGenerating();
          } else {
            this.state = VariableState.fulfilled;
            this.resolve(res);
          }
        })
        .catch(this.reject);
    } catch (error) {
      this.state = VariableState.rejected;
      this.reject(error as Error);
    }
  }

  private async startGenerating() {
    const controller = (this.controller = new AbortController());
    const signal = controller.signal;
    let generator = this.generator;
    let generated: any = undefined;
    // console.log("startGenerating", this.id, this.name, generator);

    let error: any = null;
    while (!signal.aborted && !error) {
      await new Promise((proceed, failed) => {
        setTimeout(() => {
          // create a new promise for the variable
          this.promise = Variable.createPromise(this);
          try {
            this.processing();
            Promise.resolve(generator.next(generated))
              .then(({ value, done: isDone }) => {
                // if isDone is true, the generator is done and we the generator loop should stop
                if (isDone) {
                  controller.abort();
                  this.state = VariableState.fulfilled;
                  this.emitFulfilled();
                } else {
                  generated = value;
                  this.resolve(generated);
                }
                proceed(generated);
              })
              .catch((e) => {
                error = e;
                this.reject(e as Error);
                failed(e);
              });
          } catch (e) {
            error = e;
            this.reject(e as Error);
            failed(e);
          }
        }, 1000 / 60); // run the generator at 60fps
      });
    }

    this.generator = NOOP_GENERATOR;
  }

  // mark the variable as fulfilled with a value
  private fulfilled(value: any) {
    // console.log("fulfilled", this.id, this.name, value, this.state);
    if (this.state.isDetached) return;
    this.value = value;
    this.error = undefined;

    this.emitFulfilled();

    if (this.state.isGenerating) {
      this.onGenerate();
    } else {
      this.onSuccess();
    }

    return this;
  }

  private emitFulfilled() {
    !this.builtin && this.emitter.emit("fulfilled", this);
    !this.builtin && this.emitter.emit("fulfilled:" + this.cellId, this);
  }

  // mark the variable as rejected with an error
  private rejected(error: Error) {
    // if (this.state.isStopped || this.state.isPending) return;
    if (this.state.isDetached) return;
    // console.log("rejected", this.id, this.name, error.toString());
    this.state = VariableState.rejected;
    this.error = error;
    this.value = undefined;
    this.generator = NOOP_GENERATOR;
    this.emitter.emit("rejected", this);
    this.emitter.emit("rejected:" + this.cellId, this);
    this.onError();
    return this;
  }

  onGenerate() {
    // console.log("onGenerate", this.id, this.name, "state:", this.state.value, this.value);
    this.onSuccess();
  }

  // on compute is called when the variable is computed,
  onSuccess() {
    // if (this.removed) return;
    // console.log("onProgress", this.id, this.name, "state:", this.state.value, this.value);
    const cycle = this.findAllNodesInCycle();
    if (cycle.length > 0) {
      cycle.forEach((node) => {
        node.reject(RuntimeError.circularDependency(this.cell.name));
      });
      return;
    }

    // console.log(this.id, this.name);
    this.outputs.forEach((output) => {
      if (output.state.isDetached) return;
      const inputs = output.inputs;
      // check for cycles in the output paths

      // if all inputs are fulfilled, run the output variable
      if (inputs.every((input) => input.state.isFulfilled || input.state.isGenerating)) {
        output.stop();
        output.pending();
        output.compute();
      }
    });
  }

  onError() {
    this.stop();
    const cycle = this.findAllNodesInCycle();

    if (cycle.length > 0) {
      cycle.forEach((node) => {
        node.reject(RuntimeError.circularDependency(this.cell.name));
      });
      return;
    }

    this.outputs.forEach((output) => {
      output.reject(this.error!);
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
