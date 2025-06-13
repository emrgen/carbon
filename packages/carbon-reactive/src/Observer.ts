import { noop } from "lodash";
import { Variable } from "./Variable";
import { RuntimeError } from "./x";

// Observer is a class that wraps a resolve and reject function
// single emitter multiple listeners
export class Observer {
  private readonly resolves: Function[] = [];
  private readonly rejects: Function[] = [];

  static default() {
    return new Observer(noop, noop);
  }

  static of(resolve: Function, reject: Function) {
    return new Observer(resolve, reject);
  }

  constructor(resolve: Function, reject: Function) {
    this.resolves.push(resolve);
    this.rejects.push(reject);
  }

  notify(variable: Variable) {
    if (variable.error) {
      this.reject(variable.error);
    } else {
      this.resolve(variable.value);
    }
  }

  resolve(value: any) {
    this.resolves.forEach((resolve) => resolve(value));
  }

  reject(error: RuntimeError) {
    this.rejects.forEach((reject) => reject(error));
  }

  // add a resolve function to the list
  onResolve(resolve: Function) {
    this.resolves.push(resolve);
  }

  offResolve(resolve: Function) {
    this.resolves.splice(this.resolves.indexOf(resolve), 1);
  }

  // add a reject function to the list
  onReject(reject: Function) {
    this.rejects.push(reject);
  }

  offReject(reject: Function) {
    this.rejects.splice(this.rejects.indexOf(reject), 1);
  }

  // remove all resolve and reject functions
  clear() {
    this.resolves.splice(0, this.resolves.length);
    this.rejects.splice(0, this.rejects.length);
  }
}
