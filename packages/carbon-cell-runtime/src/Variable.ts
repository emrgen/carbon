import { noop } from "lodash";
import { Module } from "./Module";
import { Promix } from "./Promix";
import { generatorish, randomString, RuntimeError } from "./x";

export type VariableName = string;
export type VariableId = string;

const noopPromix = Promix.default("noop");

interface VariableProps {
  module: Module;
  id: string;
  name: string;
  version: number;
  inputs: string[];
  definition: Function;
}

// reactive variable
export class Variable {
  module: Module;
  id: string;
  version: number = 0;

  name: VariableName;
  inputs: string[] = [];
  definition: Function;

  error: RuntimeError | null = null;
  value: any;
  promise: Promix<Variable>;

  // if the variable is a generator
  generated: any = undefined;
  generator: Function = noop;
  done: Promix<any> = noopPromix;

  static create(props: VariableProps) {
    return new Variable(props);
  }

  constructor(props: VariableProps) {
    const { module, id, name, inputs, definition, version } = props;
    this.module = module;
    this.id = id;
    this.name = name;
    this.inputs = inputs;
    this.definition = definition;
    this.promise = Promix.default(id, version);
  }

  get key() {
    return `${this.module.id}/${this.name}@${this.version}`;
  }

  get runtime() {
    return this.module.runtime;
  }

  redefine(name: string, inputs: string[], definition: Function) {
    // if the name has changed, unlink from the outputs
    this.name = name;
    this.inputs = inputs;
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

  import(modules: Module[]) {}

  // schedule an update waiting for the input promises to fulfilled if not already fulfilled
  precompute(clock: number) {}

  // compute the variable value from inputs
  // if the variable is a generator, run the generator once
  compute(inputs: Variable[]) {
    if (this.generator !== noop) {
      return this.generate(this.generator);
    }

    // make sure the variables have intended names
    if (!inputs.every((input, i) => input.name === this.inputs[i])) {
      return Promix.reject(RuntimeError.of("Input variable names do not match for " + this.key));
    }

    // ensure all inputs are fulfilled
    if (inputs.some((input) => input.error)) {
      return Promix.reject(RuntimeError.of("Input variable has error for " + this.key));
    }

    const args = inputs.map((input) => input.value);
    return Promix.resolve(this.definition(...args));
  }

  generate(value: any) {
    if (generatorish(value)) {
      this.done = Promix.default(this.id, this.version).then(() => {
        value.return();
      });

      this.generator = value;
      // run the generator once
      return Promix.of<any>((y, n) => {
        return Promix.resolve(value.next(this.generated)).then(({ value, done }) => {
          if (done) {
            this.done.fulfilled(this.generated);
            this.generated = undefined;
          } else {
            this.generated = value;
            y(value);
          }
        });
      });
    }

    return Promix.resolve(value);
  }
}
