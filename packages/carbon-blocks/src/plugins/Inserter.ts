import { ActionOrigin, BeforePlugin, Carbon, Node, Pin, PinnedSelection, Point, Transaction } from "@emrgen/carbon-core";
import { Optional } from '@emrgen/types';

declare module '@emrgen/carbon-core' {
  interface Transaction {
    inserter: {
      node(name: string): Transaction;
      before(node: Node, name: string): Transaction;
      after(node: Node, name: string): Transaction;
      append(node: Node, name: string): Transaction;
      prepend(node: Node, name: string): Transaction;
    }
  }
}


export class Insert extends BeforePlugin {
  name = "inserter";

  commands(): Record<string, Function> {
    return {
      node: this.node,
      before: this.before,
      after: this.after,
      append: this.append,
      prepend: this.prepend,
    };
  }

  // TODO: check if the node is allowed in the current context
  node(app: Carbon, name: string) {
    const { selection, tr } = app;
    if (selection.isInvalid || !selection.isCollapsed) return;

    const { start } = selection;
    const node = app.schema.type(name)?.default();
    if (!node) return;

    let at = Point.toAfter(start.node.id);
    const { parent } = start.node;
    if (parent) {
      at = Point.toAfter(parent.id);
    }

    tr.Insert(at, node)
    if (node.hasFocusable) {
      const after = PinnedSelection.fromPin(Pin.toStartOf(node)!)
      tr.Select(after, ActionOrigin.UserInput)
    }

    return tr;
  }

  append(tr: Transaction, node: Node, name: string) {
    const at = node.isVoid ? Point.toInside(node.id) : Point.toAfter(node.lastChild!.id);
    const block = tr.app.schema.type(name)?.default();
    if (!block) return;

    return this.insert(tr, at, block);
  }

  prepend(tr: Transaction, node: Node, name: string) {
    const at = node.isVoid ? Point.toInside(node.id) : Point.toBefore(node.firstChild!.id);
    const block = tr.app.schema.type(name)?.default();
    if (!block) return;

    return this.insert(tr, at, block);
  }

  before(tr: Transaction, node: Node, name: string) {
    const at = Point.toBefore(node.id);
    const block = tr.app.schema.type(name)?.default();
    if (!block) return;

    return this.insert(tr, at, block);
  }

  after(tr: Transaction, node: Node, name: string) {
    const at = Point.toAfter(node.id);
    const block = tr.app.schema.type(name)?.default();
    if (!block) return;

    return this.insert(tr, at, block);
  }

  private insert(tr: Transaction, at: Point, node: Node): Optional<Transaction> {
    tr.Insert(at, node)
    if (node.hasFocusable) {
      const after = PinnedSelection.fromPin(Pin.toStartOf(node)!)
      tr.Select(after, ActionOrigin.UserInput)
    }

    return tr;
  }
}
