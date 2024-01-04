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
      content: 'content+',
      inlineSelectable: true,
      isolate: true,
      draggable: true,
      dragHandle: true,
      // rectSelectable: true,
      blockSelectable: true,
    }
  }

  keydown(): EventHandlerMap {
    return {
      cmd_a: (ctx: EventContext<KeyboardEvent>) => {
        preventAndStopCtx(ctx);
        const {currentNode, cmd} = ctx;
        const start = Pin.toStartOf(currentNode)!
        const end = Pin.toEndOf(currentNode)!
        const selection = PinnedSelection.create(start, end);
        cmd.action.select(selection).dispatch();
      }
    }
  }
}


