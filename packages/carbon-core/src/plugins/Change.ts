import { CommandPlugin } from "../core/index";

declare module "@emrgen/carbon-core" {
  export interface Transaction {
    change: {
      replace(tr: Transaction): Transaction;
    };
  }
}

export class Change extends CommandPlugin {
  name = "change";

  commands(): Record<string, Function> {
    return {};
  }
}