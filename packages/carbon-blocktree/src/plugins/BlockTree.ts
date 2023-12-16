import { AfterPlugin, CarbonPlugin, Transaction } from "@emrgen/carbon-core";

export class BlockTree extends AfterPlugin {
  name = 'blockTree';

  undoStack: Transaction[] = [];
  redoStack: Transaction[] = [];

  transaction(tr: Transaction) {
    // console.('-------->', );
  }
}
