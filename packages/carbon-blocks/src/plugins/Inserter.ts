import { ActionOrigin, BeforePlugin, Carbon, Node, Pin, PinnedSelection, Point, Transaction } from "@emrgen/carbon-core";
import { Optional } from '@emrgen/types';
import { node } from '@emrgen/carbon-blocks';

declare module '@emrgen/carbon-core' {
  interface CarbonCommands {
    insert: {
      node(name: string): Optional<Transaction>;
      before(node: Node, name: string): Optional<Transaction>;
      after(node: Node, name: string): Optional<Transaction>;
    }
  }
}


export class Insert extends BeforePlugin {
  name = "insert";

  commands(): Record<string, Function> {
    return {
      node: this.node,
      before: this.before,
      after: this.after,
    };
  }

  // TODO: check if the node is allowed in the current context
  node(app: Carbon, name: string): Optional<Transaction> {
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

    tr.insert(at, node)
    if (node.hasFocusable) {
      const after = PinnedSelection.fromPin(Pin.toStartOf(node)!)
      tr.select(after, ActionOrigin.UserInput)
    }

    return tr;
  }

  before(app: Carbon, node: Node, name: string): Optional<Transaction> {
    const { tr } = app;

    const at = Point.toBefore(node.id);
    const block = app.schema.type(name)?.default();
    if (!block) return;

    return this.insert(app, at, block);
  }

  after(app: Carbon, node: Node, name: string): Optional<Transaction> {
    const { tr } = app;

    const at = Point.toAfter(node.id);
    const block = app.schema.type(name)?.default();
    if (!block) return;

    return this.insert(app, at, block);
  }

  private insert(app: Carbon, at: Point, node: Node): Optional<Transaction> {
    const { tr } = app;
    tr.insert(at, node)
    if (node.hasFocusable) {
      const after = PinnedSelection.fromPin(Pin.toStartOf(node)!)
      tr.select(after, ActionOrigin.UserInput)
    }

    return tr;
  }
}
