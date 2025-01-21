import {
  ActionOrigin,
  BeforePlugin,
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
      selectPageContent(selection: PinnedSelection): Transaction;
    };
  }
}

export class SelectionCommands extends BeforePlugin {
  name = "selection";

  commands(): Record<string, Function> {
    return {
      collapseToTail: this.collapseToTail,
      collapseToHead: this.collapseToHead,
      collapseToStart: this.collapseToStart,
      collapseAtStartOf: this.collapseAtStartOf,
      selectPageContent: this.selectPageContent,
    };
  }

  collapseToTail(tr: Transaction, selection: PinnedSelection) {
    const normalized = selection.normalize();
    tr.Select(normalized.collapseToTail());
  }

  collapseToHead(tr: Transaction, selection: PinnedSelection) {
    // const dr = react.cmd.transform.delete()
    const normalized = selection.normalize();
    tr.Select(normalized.collapseToHead());
  }

  collapseToStart(tr: Transaction, selection: PinnedSelection) {
    const normalized = selection.normalize();
    tr.Select(normalized.collapseToStart());
  }

  collapseAtStartOf(tr: Transaction, node: Node) {
    const after = PinnedSelection.fromPin(Pin.toStartOf(node)!);
    tr.Select(after, ActionOrigin.UserInput);
  }

  selectPageContent(tr: Transaction, selection: PinnedSelection) {
    const { tail, head } = selection;
    const commonNode = tail.node.commonNode(head.node);
    const isolate = commonNode?.closest((n) => n.isIsolate);
    if (!isolate) return;

    let from = Pin.toStartOf(isolate);
    const to = Pin.toEndOf(isolate);
    if (isolate.isPage) {
      from = Pin.toStartOf(isolate.firstChild?.nextSibling!);
    }

    if (!from || !to) return;
    tr.Select(PinnedSelection.create(from, to));
  }
}
