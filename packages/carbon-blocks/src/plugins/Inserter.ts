import {
  ActionOrigin,
  BeforePlugin,
  Carbon,
  insertNodesActions,
  Node,
  Pin,
  PinnedSelection,
  Point,
  Transaction,
} from "@emrgen/carbon-core";
import { Optional } from "@emrgen/types";

declare module "@emrgen/carbon-core" {
  interface Transaction {
    inserter: {
      insertBeforeDefault(node: Node, name: string): Transaction;
      insertAfterDefault(node: Node, name: string): Transaction;
      appendDefault(node: Node, name: string): Transaction;
      prependDefault(node: Node, name: string): Transaction;
      insertBefore(ref: Node, node: Node): Transaction;
      insertAfter(ref: Node, node: Node): Transaction;
      insertNodes(at: Point, nodes: Node[]): Transaction;
    };
  }
}

export class Insert extends BeforePlugin {
  name = "inserter";

  commands(): Record<string, Function> {
    return {
      // node: this.node,
      insertBeforeDefault: this.before,
      insertAfterDefault: this.after,
      appendDefault: this.append,
      prependDefault: this.prepend,
      insertBefore: this.insertBefore,
      insertAfter: this.insertAfter,
      insertNodes: this.insertNodes,
    };
  }

  insertNodes(tr: Transaction, at: Point, nodes: Node[]) {
    insertNodesActions(at, nodes).forEach((action) => {
      tr.Add(action);
    });
  }

  insertBefore(tr: Transaction, ref: Node, node: Node) {
    const at = Point.toBefore(ref.id);
    this.insert(tr, at, node);
  }

  insertAfter(tr: Transaction, ref: Node, node: Node) {
    const at = Point.toAfter(ref.id);
    this.insert(tr, at, node);
  }

  // TODO: check if the node is allowed in the current context
  node(app: Carbon, name: string) {
    const { selection, cmd } = app;
    if (selection.isInvalid || !selection.isCollapsed) return;

    const { start } = selection;
    const node = app.schema.type(name)?.default();
    if (!node) return;

    let at = Point.toAfter(start.node.id);
    const { parent } = start.node;
    if (parent) {
      at = Point.toAfter(parent.id);
    }

    cmd.Insert(at, node);
    if (node.hasFocusable) {
      const after = PinnedSelection.fromPin(Pin.toStartOf(node)!);
      cmd.Select(after, ActionOrigin.UserInput);
    }

    return cmd;
  }

  append(tr: Transaction, node: Node, name: string) {
    const at = node.isVoid
      ? Point.atOffset(node.id)
      : Point.toAfter(node.lastChild!.id);
    const block = tr.app.schema.type(name)?.default();
    if (!block) return;

    return this.insert(tr, at, block);
  }

  prepend(tr: Transaction, node: Node, name: string) {
    const at = node.isVoid
      ? Point.atOffset(node.id)
      : Point.toBefore(node.firstChild!.id);
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
    let at = Point.toAfter(node.id);

    const block = tr.app.schema.type(name)?.default();
    if (!block) return;

    return this.insert(tr, at, block);
  }

  private insert(
    tr: Transaction,
    at: Point,
    node: Node,
  ): Optional<Transaction> {
    tr.Insert(at, node);
    if (node.hasFocusable) {
      const after = PinnedSelection.fromPin(Pin.toStartOf(node)!);
      tr.Select(after, ActionOrigin.UserInput);
    }

    return tr;
  }
}
