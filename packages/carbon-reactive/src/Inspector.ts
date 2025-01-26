import { Runtime } from "./Runtime";

export class Inspector {
  constructor(readonly runtime: Runtime) {
    this.runtime = runtime;
  }

  // connect to the variable with the given id
  // inspect(id: string): Observer {
  //   const observer = new Observer(this.runtime, id);
  // }
}