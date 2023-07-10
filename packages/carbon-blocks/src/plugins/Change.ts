import { ActionOrigin, BeforePlugin, Carbon, Pin, PinnedSelection, Point, Transaction } from "@emrgen/carbon-core";
import { Optional } from '@emrgen/types';

declare module '@emrgen/carbon-core' {
  interface CarbonCommands {
    change: {
      into(name: string): Optional<Transaction>;
    }
  }
}


export class Change extends BeforePlugin {
  name = "change";

  commands(): Record<string, Function> {
    return {
      into: this.into
    };
  }

  // TODO: check if the node is allowed in the current context
  into(app: Carbon, name: string): Optional<Transaction> {
    const { selection, tr } = app;
    if (selection.isInvalid || !selection.isCollapsed) return;

    const { parent } = selection.start.node;
    if (parent) {
      tr.change(parent.id, parent.name, name)
      .select(selection, ActionOrigin.UserInput)
    }

    return tr;
  }
}
