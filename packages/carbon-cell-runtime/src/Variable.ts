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
  dependencies: string[];
  definition: Function;
}

// reactive variable
export class Variable {
  module: Module;
  id: string;
  version: number = 0;

  name: VariableName;
  dependencies: string[] = [];
  definition: Function;

  // this has higher priority than the connection in the graph
  // this are updated when the variable is updated, created or deleted
  // runtime graph is updated based on these variables
  inputs: Variable[] = [];
  outputs: Variable[] = [];

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

  static randomName() {
    return `unnamed_${randomString(10)}`;
  }

  constructor(props: VariableProps) {
    const { module, id, name, dependencies, definition, version } = props;
    this.module = module;
    this.id = id;
    this.name = name;
    this.dependencies = dependencies;
    this.definition = definition;
    this.promise = Promix.default(id, version);
  }

  get key() {
    return `${this.module.id}/${this.name}@${this.version}`;
  }

  get runtime() {
    return this.module.runtime;
  }

  redefine(name: string, dependencies: string[], definition: Function) {
    // if the name has changed, unlink from the outputs
    this.name = name;
    this.dependencies = dependencies;
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
    console.log("computing:", this.id, "=>", this.key);

    if (this.generator !== noop) {
      return this.generate(this.generator);
    }

    // ensure all inputs are fulfilled
    const error = inputs.some((input) => input.error);
    if (error) {
      return Promix.resolve(error);
    }

    const inputMap = new Map(inputs.map((input) => [input.name, input]));
    // make sure the input variables have matching names
    const missing = inputs.find((input, i) => !inputMap.has(input.name));
    if (missing) {
      return Promix.resolve(RuntimeError.notDefined(missing.name));
    }

    // get the input variable values in order by name
    const deps = this.dependencies.map((name) => inputMap.get(name)).filter(Boolean) as Variable[];
    if (deps.length !== this.dependencies.length) {
      return Promix.resolve(RuntimeError.of(`Variable ${this.name} has missing dependencies`));
    }

    // get the values of the input variables
    const args = deps.map((input) => input.value);
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
            // if the generator is not done, add it to the runtime for recomputation
            this.runtime.generators.add(this);
            y(value);
          }
        });
      });
    }

    return Promix.resolve(value);
  }
}
