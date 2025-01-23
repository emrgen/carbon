import { noop } from "lodash";
import { Module } from "./Module";
import { Observer } from "./Observer";
import { generatorish, randomString, RuntimeError } from "./x";

export type VariableName = string;
export type VariableId = string;

interface VariableProps {
  module: Module;
  id: string;
  name: string;
  inputs: string[];
  definition: Function;
}

// reactive variable
export class Variable {
  module: Module;
  id: string;
  name: VariableName;
  version: number = 0;
  inputArgs: string[] = [];
  definition: Function;
  inputs: Variable[] = [];
  outputs: Variable[] = [];
  indegree: number = 0;
  reachable: boolean = false;
  error: RuntimeError | null = null;
  value: any;
  generatorValue: any = undefined;
  promise: Promise<Variable> = Promise.resolve(this);
  pending: boolean = false;
  observer: Observer = Observer.default();

  static create(props: VariableProps) {
    return new Variable(props);
  }

  constructor(props: VariableProps) {
    const { module, id, name, inputs, definition } = props;
    this.module = module;
    this.id = id;
    this.name = name;
    this.inputArgs = inputs;
    this.definition = definition;

    this.fulfilled = this.fulfilled.bind(this);
    this.rejected = this.rejected.bind(this);
  }

  addObserver(observer: Observer) {
    this.observer = observer;
  }

  get runtime() {
    return this.module.runtime;
  }

  redefine(name: string, inputs: string[], definition: Function) {
    // if the name has changed, unlink from the outputs

    this.name = name;
    this.inputArgs = inputs;
    this.definition = definition;
  }

  // break all links before leaving
  // set the definition to noop
  delete(props?: { module: boolean }) {
    if (props?.module) {
      this.module.delete(this.id);
      return;
    }

    this.redefine(`undefined_${randomString(10)}`, [], noop);
  }

  import(modules: Module[]) {
    const inputs = new Set(this.inputArgs);
    const inputVars = new Map();
    this.inputs.forEach((v) => {
      inputVars.set(v.name, v);
    });

    for (const mod of modules) {
      for (const [id, variable] of mod.variableNames) {
        // add the input args to the variable
        if (inputs.has(variable.name)) {
          inputVars.set(variable.name, variable);
        }
      }
    }

    // update the inputs
    this.inputs = Array.from(inputVars.values());

    this.inputs.forEach((v) => {
      v.outputs.push(this);
    });
  }

  // schedule an update waiting for the input promises to fulfilled if not already fulfilled
  precompute(clock: number) {
    if (clock <= this.version) {
      throw RuntimeError.of("Clock should be greater than the current version");
    }

    this.version = clock;

    if (this.inputArgs.length === 0) {
      this.value = Promise.resolve(this.definition());
      return;
    }

    this.pending = true;

    const missing = this.missingInputs();

    // if any of the inputs are missing, throw an error through the promise
    if (missing.length) {
      const msg = missing.join(", ") + "variables are undefined";
      const error = RuntimeError.of(msg);
      this.promise = Promise.reject(error);
      this.value = undefined;
      this.error = error;
      this.pending = false;
      return;
    }

    // recalculate the value
    const inputPromises = this.inputArgs
      .map((v) => this.module.variableNames.get(v)?.promise)
      .filter(Boolean) as Promise<Variable>[];

    if (inputPromises.length !== this.inputs.length) {
      return;
    }

    // wait for all the inputs to fulfilled before resolving/rejecting the promise
    this.promise = new Promise((res, rej) => {
      const promise = Promise.all(inputPromises);
      promise
        .then(resolve(this, this.version, res, rej))
        .catch(reject(this, this.version, rej));
    });
  }

  compute() {
    this.pending = true;
    this.promise.then(this.fulfilled).catch(this.rejected);
  }

  generate(value: any) {
    this.pending = true;
    const generator = value.return();

    const promise = new Promise((resolve) => {
      return resolve(generator.next(this.generatorValue) as any);
    }).then((r: any) => {
      return r.done ? undefined : r.value;
    });

    promise
      .then(this.fulfilled)
      .then(() => this.runtime.dirty.add(this))
      .then(() => this.runtime.compute())
      .catch(this.rejected);
  }

  // if the variable is generatorish recalculate the value and propagate the change
  recompute(clock: number) {}

  fulfilled(value: any) {
    if (generatorish(value)) {
      this.generate(value);
      return;
    }

    this.pending = false;
    this.error = null;
    this.value = value;
    this.observer.notify(this);
  }

  rejected(error: RuntimeError) {
    this.pending = false;
    this.error = error;
    this.value = undefined;
    this.observer.notify(this);
  }

  missingInputs() {
    const inputs = new Set(this.inputs.map((v) => v.name));
    return this.inputArgs.filter((v) => !inputs.has(v));
  }
}

function variableUndefined() {
  throw new Error("Variable is undefined");
}

// fulfilled the variable with the given inputs
function resolve(
  variable: Variable,
  clock: number,
  resolve: Function,
  reject: Function,
) {
  // called with the resolved inputs
  return (inputs: Variable[]) => {
    if (variable.version !== clock) {
      return;
    }

    if (variable.generator) {
      variable.generate(variable.value);
    } else if (variable.async) {
      variable
        .definition(...inputs.map((v) => v.value))
        .then(resolve)
        .catch(reject);
    } else {
      variable.value = variable.definition(...inputs.map((v) => v.value));
      variable.pending = false;
      resolve(variable);
    }
  };
}

// rejected the variable with the given error
function reject(variable: Variable, clock: number, reject: Function) {
  // called when failed to fulfilled the input variables
  return (error: Error) => {
    if (variable.version !== clock) {
      return;
    }

    // TODO: if there are multiple errors from dependencies, how to handle them?
    // current implementation only stores the first error as the first error will cause the Promise.all to rejected
    reject(error);
  };
}
