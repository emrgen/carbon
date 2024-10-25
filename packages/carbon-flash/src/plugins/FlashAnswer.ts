import {
  CarbonPlugin,
  EventContext,
  EventHandlerMap,
  NodeSpec,
  preventAndStopCtx,
} from "@emrgen/carbon-core";

export class FlashAnswer extends CarbonPlugin {
  name = "flashAnswer";

  spec(): NodeSpec {
    return {
      group: "",
      content: "title content*",
      isolate: true,
      pasteBoundary: true,
      props: {
        local: {
          html: {
            contentEditable: false,
            suppressContentEditableWarning: true,
          },
        },
      },
    };
  }

  keydown(): EventHandlerMap {
    return {
      enter(ctx: EventContext<KeyboardEvent>) {
        const { app, selection, currentNode } = ctx;
        if (
          selection.inSameNode &&
          selection.start.node.parent?.eq(currentNode)
        ) {
          preventAndStopCtx(ctx);
          app.cmd.collapsible.split(selection)?.Dispatch();
        }
      },
    };
  }
}