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
  PENDING = "pending", // computation is in progress, inputs are not yet fulfilled
  PAUSED = "paused", // computation is paused, inputs are fulfilled, but not yet computed
  COMPUTING = "computing", // scheduled for computation, but not yet computed
  FULFILLED = "fulfilled",
  REJECTED = "rejected",
}

class VariableState {
  value: State;

  static undefined = new VariableState(State.UNDEFINED);

  constructor(value: State) {
    this.value = value;
  }

  transition(newValue: State) {
    return new VariableState(newValue);
  }

  isUndefined() {
    return this.value === State.UNDEFINED;
  }

  isPending() {
    return this.value === State.PENDING;
  }

  isPaused() {
    return this.value === State.PAUSED;
  }

  isComputing() {
    return this.value === State.COMPUTING;
  }

  isFulfilled() {
    return this.value === State.FULFILLED;
  }

  isRejected() {
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

  // this has higher priority than the connection in the graph
  // this are updated when the variable is created, redefined or deleted
  // runtime graph is updated based on these variablesById
  inputs: Variable[] = [];
  outputs: Variable[] = [];

  state: State;

  // promise that resolves when the variable calculation is done
  // the calculation is done when all inputs are fulfilled
  // the calculation can result in an error or a value
  promise: Promised;
  resolve: (value: any) => void = noop;
  reject: (error: Error) => void = noop;
  error: RuntimeError | undefined;
  value: any = UNDEFINED_VALUE;

  // if the variable is a generator
  private generator = NOOP_GENERATOR;
  private generating: boolean = false;
  private generatorish: boolean = false;
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

    this.state = State.UNDEFINED;

    this.promise = this.createPromise();
    this.controller = new AbortController();

    this.pending = this.pending.bind(this);
    this.fulfilled1 = this.fulfilled1.bind(this);
    this.rejected1 = this.rejected1.bind(this);

    this.compute = this.compute.bind(this);
    this.pause = this.pause.bind(this);
    this.onProgress = this.onProgress.bind(this);
  }

  createPromise() {
    return (this.promise = Promised.create(this.fulfilled1, this.rejected1, this.id));
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
    this.state = State.UNDEFINED;
    this.promise = Promised.create(this.fulfilled1, this.rejected1, cell.id);
    this.controller = new AbortController();
    this.generator = NOOP_GENERATOR;
    this.value = UNDEFINED_VALUE;
    this.error = undefined;
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
          node.onReject1(RuntimeError.circularDependency(this.cell.name));
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
          output.pause();
          output.compute(inputs);
        }
      });
    } else if (this.promise.isRejected) {
      // if the promise is rejected, we need to pause the generator
      // and mark the variable as rejected
      this.pause();

      this.outputs.forEach((output) => {
        output.pause();
        output.pending();
        output.onReject1(this.error || RuntimeError.of("Variable computation failed"));
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

  // force play the variable
  play() {
    this.runtime.version += 1;
    this.runtime.markDirty(this);
    this.runtime.schedule();
  }

  // pause the variable computation, pause the generator if it is a generator
  pause() {
    if (this.generating) {
      debugger;
      if (this.generatorish) {
        this.stopGenerating();
      } else {
        // cache the last computed value
        this.promise.fulfilled(this.value);
      }
    }
  }

  // compute the variable value from inputs
  // if the variable is a generator,
  // run the generator once,
  // the first run will mark the generator as dirty,
  // triggering the runtime to compute it again
  compute(inputs: Variable[]) {
    this.state = State.COMPUTING;
    this.promise = this.createPromise();
    console.log("computing:", this.id, "=>", this.name, this);

    // ensure all inputs are fulfilled
    const error = inputs.find((input) => input.error);
    if (error) {
      this.onReject1(error.error!);
      return;
    }

    const inputMap = new Map(inputs.map((input) => [input.name, input]));
    // console.log(inputs.map((input) => input));

    // make sure the input variablesById have matching names
    const missing = this.dependencies.find((name, i) => !inputMap.has(name));
    if (missing) {
      return Promise.reject(RuntimeError.notDefined(last(missing.split(":"))!)).catch(
        this.rejected1,
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
          this.generatorish = true;
          this.generator = res;
          this.generating = true;
          this.startGenerating();
        } else {
          // console.log("fulfilled", this.id, this.name, res);
          this.promise.fulfilled(res);
        }
      });
    } catch (error) {
      this.onReject1(error as Error);
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
          this.promise = this.createPromise();
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
                this.promise.fulfilled(value);
                proceed(value);
              })
              .catch((e) => {
                this.promise.rejected(e as Error);
                failed(e);
                error = e;
              });
          } catch (e) {
            this.promise.rejected(e as Error);
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

  pending() {
    // this.promise.fulfilled(""); // fulfill the promise with an empty value
    // create a new promise for the next run
    this.promise = Promised.resolved(UNDEFINED_VALUE, this.id);
    this.value = UNDEFINED_VALUE;
    this.state = State.PENDING;
    this.error = undefined;
    const done = () => ({ value: this.value, done: true });
    this.generator = { next: done, return: done };
    this.runtime.emit("pending", this);
    this.runtime.emit("pending:" + this.cellId, this);
    // this.onProgress();
    return this;
  }

  // mark the variable as fulfilled with a value
  private fulfilled1(value: any) {
    this.state = State.FULFILLED;
    // console.log(this.id, "fulfilled", this.name, "value:", value);
    // console.log(this.id, "value", value, this.builtin);
    this.value = value;
    this.error = undefined;
    !this.builtin && this.runtime.emit("fulfilled", this);
    !this.builtin && this.runtime.emit("fulfilled:" + this.cellId, this);
    this.onProgress();
    return this;
  }

  onReject1(error: Error) {
    // console.error("onReject1", this.id, this.name, error);
    if (this.state === State.REJECTED) {
      return;
    }
    this.promise.rejected(error);
  }

  // mark the variable as rejected with an error
  private rejected1(error: Error) {
    const variable = this.runtime.variablesById.get(this.id);
    // if (this.version === this.rejectedVersion) {
    //   return variable;
    // }

    this.error = error;
    this.value = undefined;
    this.generator = NOOP_GENERATOR;
    // this.promise.rejected(error);
    // console.log("rejected", this.id, this.name, error);
    this.runtime.emit("rejected", this);
    this.runtime.emit("rejected:" + this.cellId, this);
    this.onProgress();
    return this;
  }

  removed() {
    this.value = UNDEFINED_VALUE;
    this.error = undefined;
    this.state = State.UNDEFINED;
    this.generator = NOOP_GENERATOR;
    !this.builtin && this.runtime.emit("removed", this);
    !this.builtin && this.runtime.emit("removed:" + this.cellId, this);
  }
}

function error(e) {
  console.log(e);
}
