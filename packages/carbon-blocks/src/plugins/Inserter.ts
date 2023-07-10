import { ActionOrigin, BeforePlugin, Carbon, Pin, PinnedSelection, Point, Transaction } from "@emrgen/carbon-core";
import { Optional } from '@emrgen/types';

declare module '@emrgen/carbon-core' {
  interface CarbonCommands {
    insert: {
      node(name: string): Optional<Transaction>;
    }
  }
}


export class Insert extends BeforePlugin {
  name = "insert";

  commands(): Record<string, Function> {
    return {
      node: this.node
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
}
