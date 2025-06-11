import { noop } from "lodash";
import { Cell } from "./Cell";
import { Module, ModuleVariableId, ModuleVariableName } from "./Module";
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
  promise: Promix<Variable>;
  error: RuntimeError | undefined;
  value: any;

  // if the variable is a generator
  generator: { next: Function; return: Function } = { next: noop, return: noop };
  generated: any = undefined;
  // similar to done channel in go
  done = false;
  // version of the variable calculation
  fulfilledVersion: number = 0;

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

    this.promise = Promix.default(this.id, this.version);

    this.fulfilled = this.fulfilled.bind(this);
    this.rejected = this.rejected.bind(this);
    this.compute = this.compute.bind(this);
    this.generateFirst = this.generateFirst.bind(this);
    this.addDirty = this.addDirty.bind(this);
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

  // schedule an update waiting for the input promises to fulfilled if not already fulfilled
  precompute(clock: number) {}

  // compute the variable value from inputs
  // if the variable is a generator,
  // run the generator once,
  // the first run will mark the generator as dirty,
  // triggering the runtime to compute it again
  compute(inputs: Variable[], version: number) {
    LOG && console.log("computing:", this.id, "=>", this.cell.code);

    // if (inputs.length) {
    //   console.log(
    //     "deps",
    //     inputs.map((v) => v.value ?? v.error?.toString()),
    //   );
    // }

    // ensure all inputs are fulfilled
    const error = inputs.find((input) => input.error);
    if (error) {
      return Promix.reject(error.error, this.id, this.version).catch(this.rejected);
    }

    const inputMap = new Map(inputs.map((input) => [input.name, input]));
    // console.log(inputs, this.cell.dependencies);
    // make sure the input variablesById have matching names
    const missing = this.dependencies.find((name, i) => !inputMap.has(name));
    if (missing) {
      return Promix.reject(
        RuntimeError.notDefined(missing.split(":")[1]),
        this.id,
        this.version,
      ).catch(this.rejected);
    }

    // get the input variable values in order by name
    const deps = this.dependencies.map((name) => inputMap.get(name)).filter(Boolean) as Variable[];
    if (deps.length !== this.dependencies.length) {
      return Promix.reject(RuntimeError.of(`Variable ${this.cell.name} has missing dependencies`));
    }

    // get the values of the input variablesById
    const args = deps.map((input) => input.value);

    try {
      const res = this.cell.definition.bind(this)(...args);
      return Promise.resolve(res)
        .then(this.generateFirst)
        .then(this.addDirty)
        .then((v) => this.fulfilled(v, version))
        .catch(this.rejected);
    } catch (e) {
      return Promix.reject(e, this.id, this.version).catch((v) => this.rejected(v, version));
    }
  }

  // run the generator once and save the value at the generated field

  // if value is a generator, run the generator once
  generateFirst(value: any) {
    if (generatorish(value)) {
      // console.log("generateFirst", value);
      this.generator = value;
      return this.generate();
    }

    return Promix.resolve(value);
  }

  generateNext() {
    try {
      return this.generate().then(this.addDirty).then(this.fulfilled);
    } catch (e) {
      return Promix.reject(e, this.id, this.version).catch(this.rejected);
    }
  }

  // marks the generator variable as dirty
  addDirty(value: any) {
    if (this.generator.next !== noop && !this.done) {
      this.runtime.generators.add(this);
    }
    return value;
  }

  // run the generator once and save the value at the generated field
  generate() {
    try {
      return Promix.resolve(this.generator.next(this.generated))
        .then(({ value, done }) => {
          if (done) {
            return Promise.resolve(value).then((v) => {
              this.done = true;
              if (value !== undefined) {
                this.generated = v;
              }

              return this.generated;
            });
          } else {
            // runtime dirty generators
            return Promise.resolve(value).then((v) => {
              this.generated = v;
              // if the generator is not done, add it to the runtime for computation
              // this.runtime.generators.add(this);
              return v;
            });
          }
        })
        .catch(error);
    } catch (e) {
      return Promix.reject(e, this.id, this.version).catch(this.rejected);
    }
  }

  pending() {
    this.runtime.emit("pending", this);
    this.runtime.emit("pending:" + this.cellId, this);
  }

  // mark the variable as rejected with an error
  rejected(error: RuntimeError, version: number = this.promise.version) {
    if (this.fulfilledVersion >= version) {
      return this;
    }
    // console.log("rejected", this.promise.version, version, this.fulfilledVersion);
    this.fulfilledVersion = version;

    if (this.promise.version !== version) {
      return this.promise.fulfilled(this);
    }

    this.error = error;
    this.value = undefined;
    this.generator = { next: noop, return: noop };
    this.runtime.emit("rejected", this);
    this.runtime.emit("rejected:" + this.cellId, this);
    this.promise.fulfilled(this);
    return this;
  }

  // mark the variable as fulfilled with a value
  fulfilled(value: any, version: number = this.promise.version) {
    if (this.fulfilledVersion >= version) {
      return this;
    }
    // console.log("fulfilled", this.promise.version, version, this.fulfilledVersion);
    this.fulfilledVersion = version;

    if (this.promise.version !== version) {
      return this.promise.fulfilled(this);
    }

    this.value = value;
    this.error = undefined;
    this.promise.fulfilled(this);
    !this.builtin && this.runtime.emit("fulfilled", this);
    !this.builtin && this.runtime.emit("fulfilled:" + this.cellId, this);
    return this;
  }
}

function error(e) {
  console.log(e);
}
