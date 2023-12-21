import { Transaction } from "./Transaction";
import { CarbonAction } from "./actions";

export class CarbonCommandChain extends Transaction {
  active: boolean = false;

  Dispatch(isNormalizer: boolean = false): Transaction {
    this.app.chain = new CarbonCommandChain(this.app, this.tm, this.pm, this.sm);
    return super.Dispatch(isNormalizer);
  }

  Add(action: CarbonAction | CarbonAction[]): Transaction {
    this.active = true;
    super.Add(action);

    return this;
  }
}
