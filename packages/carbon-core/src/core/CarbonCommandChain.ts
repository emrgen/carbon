import { Transaction } from "./Transaction";
import { CarbonAction } from "./actions";

export class CarbonCommandChain extends Transaction {
  active: boolean = false;

  dispatch(isNormalizer: boolean = false): Transaction {
    this.app.chain = new CarbonCommandChain(this.app, this.tm, this.pm, this.sm);
    return super.dispatch(isNormalizer);
  }

  add(action: CarbonAction | CarbonAction[]): Transaction {
    this.active = true;
    super.add(action);

    return this;
  }
}
