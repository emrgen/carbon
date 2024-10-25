import {
  CarbonPlugin,
  EventContext,
  EventHandlerMap,
  NodeSpec,
  preventAndStopCtx,
} from "@emrgen/carbon-core";

export class FlashView extends CarbonPlugin {
  name = "flashView";

  spec(): NodeSpec {
    return {
      group: "",
      content: "title content*",
      isolate: true,
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
        // if selection is within the collapsible node title split the collapsible node
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