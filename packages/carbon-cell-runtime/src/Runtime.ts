import { EventEmitter } from "events";
import { SemVer } from "semver";
import { Module, ModuleNameVersion } from "./Module";
import { Variable, VariableName } from "./Variable";

// Think a whole notebook as a runtime
export class Runtime extends EventEmitter {
  id: string;
  version: SemVer;

  // each variable refresh updates the version
  clock: number = 0;

  // save the module using moduleName@version as key
  modules: Map<ModuleNameVersion, Module> = new Map();

  // multiple modules may have variable with same name
  // variable defined later will overwrite the previous one
  // deleting a variable will reveal the previous one
  variables: Map<VariableName, Variable> = new Map();

  // generated from variables map
  variablesByName: Map<string, Variable[]> = new Map();

  // variables that are dirty and need to be recomputed
  dirty: Set<Variable> = new Set();

  // generators that are dirty and need to be recomputed
  //
  generators: Set<Variable> = new Set();

  static create(id: string, version: string) {
    return new Runtime(id, version);
  }

  constructor(id: string, version: string) {
    super();
    this.id = id;
    this.version = new SemVer(version);
  }

  module(id: string, name: string, version: string) {
    const modVersion = new SemVer(version);
    // if the module is already existing, return it
    if (this.modules.has(`${id}@${modVersion.toString()}`)) {
      return this.modules.get(id);
    }

    const mod = Module.create(this, id, name, version);
    this.modules.set(id, mod);

    return mod;
  }

  // connect the dirty variables and find out the roots
  precompute() {}

  // compute the roots
  compute() {}

  // if there were generators, run them
  postcompute() {}
}