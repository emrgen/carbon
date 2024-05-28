import {
  CarbonPlugin,
  EventContext,
  EventHandlerMap,
  NodeSpec,
} from "@emrgen/carbon-core";

declare module "@emrgen/carbon-core" {
  interface Transaction {}
}

export class CodeBox extends CarbonPlugin {
  name = "codeBox";

  spec(): NodeSpec {
    return {
      group: "content",
      content: "codeLine+",
      isolate: true,
      blockSelectable: true,
      rectSelectable: true,
      draggable: true,
      dragHandle: true,
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
      backspace: (ctx: EventContext<KeyboardEvent>) => {
        console.log("backspace", ctx.type, ctx.event.key, ctx);
        const { selection, currentNode, cmd } = ctx;
        const { start } = selection;
        if (
          selection.isCollapsed &&
          selection.head.isAtStartOfNode(currentNode)
        ) {
          console.log("TODO: unwraps children of code node");
          // cmd.transform.joinBackward(selection).Dispatch();
          // cmd.transform.unwrap(node).Dispatch();
        }
      },
    };
  }
}
