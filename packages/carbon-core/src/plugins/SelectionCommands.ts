import { BeforePlugin } from "../core/CarbonPlugin";
import {
  ActionOrigin,
  Node,
  Pin,
  PinnedSelection,
  Transaction,
} from "@emrgen/carbon-core";

declare module "@emrgen/carbon-core" {
  interface Transaction {
    selection: {
      collapseToTail(selection: PinnedSelection): Transaction;
      collapseToHead(selection: PinnedSelection): Transaction;
      collapseToStart(selection: PinnedSelection): Transaction;
      collapseAtStartOf(node: Node): Transaction;
    };
  }
}

type Commands = {
  [key: string]: Function | Commands;
};

export class SelectionCommands extends BeforePlugin {
  name = "selection";

  commands(): Record<string, Function> {
    return {
      collapseToTail: this.collapseToTail,
      collapseToHead: this.collapseToHead,
      collapseToStart: this.collapseToStart,
      collapseAtStartOf: this.collapseAtStartOf,
    };
  }

  collapseToTail(tr: Transaction, selection: PinnedSelection) {
    const normalized = selection.normalize();
    tr.select(normalized.collapseToTail());
  }

  collapseToHead(tr: Transaction, selection: PinnedSelection) {
    // const dr = react.cmd.transform.delete()
    const normalized = selection.normalize();
    tr.select(normalized.collapseToHead());
  }

  collapseToStart(tr: Transaction, selection: PinnedSelection) {
    const normalized = selection.normalize();
    tr.select(normalized.collapseToStart());
  }

  collapseAtStartOf(tr: Transaction, node: Node) {
    const after = PinnedSelection.fromPin(Pin.toStartOf(node)!);
    tr.Select(after, ActionOrigin.UserInput);
  }
}
