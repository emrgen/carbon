import {
  CarbonPlugin,
  EventContext,
  EventHandlerMap,
  NodeSpec,
  preventAndStopCtx,
} from "@emrgen/carbon-core";

declare module "@emrgen/carbon-core" {
  interface Transaction {}
}

export class Code extends CarbonPlugin {
  name = "code";

  spec(): NodeSpec {
    return {
      group: "content",
      content: "title",
      blockSelectable: true,
      rectSelectable: true,
      draggable: true,
      dragHandle: true,
      tag: "pre",
      props: {
        local: {
          placeholder: {
            empty: "Code",
            focused: "Write some code",
          },
          html: {
            suppressContentEditableWarning: true,
          },
        },
      },
    };
  }

  keydown(): EventHandlerMap {
    return {
      enter: (ctx: EventContext<any>) => {
        const { app } = ctx;
        const { selection } = ctx.app.state;
        // insert a new line into the title
        if (selection.isCollapsed) {
          preventAndStopCtx(ctx);
          app.cmd.transform.insertText(selection, "\n").Dispatch();
        }
      },
      backspace: (ctx: EventContext<any>) => {
        const { app, currentNode } = ctx;
        const { selection } = app.state;
        if (selection.isCollapsed) {
          const { head } = selection;
          if (head.isAtStartOfNode(currentNode)) {
            preventAndStopCtx(ctx);
            app.cmd.Change(currentNode, "section").Select(selection).Dispatch();
          }
        }
      },
    };
  }
}
