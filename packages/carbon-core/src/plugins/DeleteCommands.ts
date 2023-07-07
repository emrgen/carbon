

import { Optional } from "@emrgen/types";
import { Carbon } from "../core/Carbon";
import { BeforePlugin } from "../core/CarbonPlugin";
import { SelectionPatch } from "../core/DeleteGroup";
import { Transaction } from "../core/Transaction";


declare module '@emrgen/carbon-core' {
  export interface CarbonCommands {
    delete: {
      patch(patch: SelectionPatch): Optional<Transaction>;
    };
  }
}

//
export class DeleteCommands extends BeforePlugin {

  name = "delete";

  commands() {
    return {
      patch: this.patch,
    };
  }

  //
  patch(app: Carbon, patch: SelectionPatch = SelectionPatch.fromState(app.state)) {

  }

}
