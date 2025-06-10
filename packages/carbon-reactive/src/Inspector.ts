import { Variable } from "./Variable";

export class Inspector {
  constructor(readonly variable: Variable) {}

  // connect to the variable with the given id
  // inspect(id: string): Observer {
  //   const observer = new Observer(this.runtime, id);
  // }
}
