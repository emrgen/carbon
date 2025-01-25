import {noop} from "lodash";
import {Cell} from "./Cell";
import {Module} from "./Module";
import {Promix} from "./Promix";
import {generatorish, randomString, RuntimeError} from "./x";

export type VariableName = string;
export type VariableId = string;

const noopPromix = Promix.default("noop");

interface VariableProps {
  module: Module;
  cell: Cell;
}

// reactive variable
export class Variable {
  module: Module;

  cell: Cell;

  // this has higher priority than the connection in the graph
  // this are updated when the variable is updated, created or deleted
  // runtime graph is updated based on these variables
  inputs: Variable[] = [];
  outputs: Variable[] = [];

  error: RuntimeError | undefined;
  value: any;
  promise: Promix<Variable>;

  // if the variable is a generator
  generated: any = undefined;
  generator: { next: Function; return: Function } = {next: noop, return: noop};
  done: Promix<any> = noopPromix;

  static create(props: VariableProps) {
    return new Variable(props);
  }

  static randomName() {
    return `unnamed_${randomString(10)}`;
  }

  constructor(props: VariableProps) {
    const {module, cell} = props;
    this.module = module;
    this.cell = cell;
    this.promise = Promix.default(this.id, this.version);

    this.fulfilled = this.fulfilled.bind(this);
    this.rejected = this.rejected.bind(this);
    this.compute = this.compute.bind(this);
    this.generateFirst = this.generateFirst.bind(this);
  }

  get id() {
    return this.cell.id;
  }

  get version() {
    return this.cell.version;
  }

  set version(version: number) {
    this.cell.version = version;
  }

  get name() {
    return this.cell.name;
  }

  get uid() {
    return `${this.module.id}/${this.name}@${this.version}`;
  }

  get dependencies() {
    return this.cell.dependencies;
  }

  get runtime() {
    return this.module.runtime;
  }

  redefine(cell: Cell) {
    this.cell = cell;
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

  import(modules: Module[]) {
  }

  // schedule an update waiting for the input promises to fulfilled if not already fulfilled
  precompute(clock: number) {
  }

  // compute the variable value from inputs
  // if the variable is a generator, run the generator once
  compute(inputs: Variable[]) {
    console.log("computing:", this.id, "=>", this.cell.code);

    if (this.generator.return !== noop) {
      return this.done.fulfilled(this.generated);
    }

    // ensure all inputs are fulfilled
    const error = inputs.find((input) => input.error);
    if (error) {
      return Promix.reject(error.error, this.id, this.version).catch(this.rejected);
    }

    const inputMap = new Map(inputs.map((input) => [input.name, input]));
    // make sure the input variables have matching names
    const missing = this.dependencies.find((name, i) => !inputMap.has(name));
    if (missing) {
      return Promix.reject(RuntimeError.notDefined(missing), this.id, this.version)//.catch(this.rejected);
    }

    // get the input variable values in order by name
    const deps = this.dependencies.map((name) => inputMap.get(name)).filter(Boolean) as Variable[];
    if (deps.length !== this.dependencies.length) {
      return Promix.reject(RuntimeError.of(`Variable ${this.name} has missing dependencies`));
    }

    // get the values of the input variables
    const args = deps.map((input) => input.value);

    return Promise.resolve(this.cell.definition(...args))
    // .then(this.generateFirst, this.rejected).catch(c => console.log(c))
  }

  // mark the variable as rejected with an error
  rejected(error: RuntimeError) {
    this.error = error;
    this.value = undefined;
    this.runtime.emit("rejected", this.cell, error.toString());
    this.promise.fulfilled(this)
    return this
  }

  // mark the variable as fulfilled with a value
  fulfilled(value: any) {
    this.value = value;
    this.error = undefined;
    this.runtime.emit("fulfilled", this.cell, value);
    this.promise.fulfilled(this)
    return this;
  }

  // run the generator once and save the value at the generated field


  // if value is a generator, run the generator once
  generateFirst(value: any) {
    if (generatorish(value)) {
      this.done = Promix.default(this.id, this.version).then(() => {
        value.return();
      });

      this.generator = value;
      return this.generate()
    }

    return Promix.resolve(value);
  }

  generateNext() {
    if (this.done.isFulfilled) {
      return Promix.resolve(this.generated);
    }
    return this.generate()
  }

  generate() {
    return Promix.resolve(this.generator.next(this.generated)).then(({value, done}) => {
      if (done) {
        return Promise.resolve(value).then(v => {
          this.done.fulfilled(v);
          return this.generated
        })
      } else {
        return Promise.resolve(value).then(v => {
          this.generated = v;
          // if the generator is not done, add it to the runtime for recomputation
          this.runtime.generators.add(this);
          return v;
        })
      }
    });
  }
}
