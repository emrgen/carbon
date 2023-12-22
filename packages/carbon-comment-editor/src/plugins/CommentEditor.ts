import {
  CarbonPlugin,
  EventContext,
  EventHandlerMap,
  NodeSpec,
  preventAndStopCtx,
  Pin,
  PinnedSelection
} from "@emrgen/carbon-core";

declare module '@emrgen/carbon-core' {
  interface Transaction {
  }
}

export class CommentEditor extends CarbonPlugin {

  name = 'commentEditor';

  spec(): NodeSpec {
    return {
      group: 'content',
      content: 'content*',
      selectable: true,
      isolating: true,
      draggable: true,
      dragHandle: true,
      rectSelectable: true,
      blockSelectable: true,
    }
  }

  keydown(): EventHandlerMap {
    return {
      cmd_a: (ctx: EventContext<KeyboardEvent>) => {
        preventAndStopCtx(ctx);
        const {node, cmd} = ctx;
        const start = Pin.toStartOf(node)!
        const end = Pin.toEndOf(node)!
        const selection = PinnedSelection.create(start, end);
        cmd.action.select(selection).dispatch();
      }
    }
  }
}


