import {
  CarbonPlugin,
  ClassPathLocal,
  cloneFrozenNode,
  CodeLanguagePath,
  CodeThemeNamePath,
  EventContext,
  EventHandlerMap,
  Node,
  NodeEncoder,
  NodeSpec,
  Pin,
  PinnedSelection,
  preventAndStopCtx,
  Writer,
} from "@emrgen/carbon-core";
import { isKeyHotkey } from "is-hotkey";
import { isEqual } from "lodash";

declare module "@emrgen/carbon-core" {
  interface Transaction {}
}

export class Code extends CarbonPlugin {
  name = "code";

  spec(): NodeSpec {
    return {
      group: "content",
      content: "title",
      tag: "div",
      selection: {
        block: true,
        inline: true,
      },
      dnd: {
        draggable: true,
        handle: true,
      },
      code: true,
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
        [CodeThemeNamePath]: "catppuccin-frappe",
        [CodeLanguagePath]: "javascript",
      },
    };
  }

  keydown(): EventHandlerMap {
    return {
      backspace: (ctx: EventContext<any>) => {
        const { app, currentNode } = ctx;
        const { selection } = app.state;
        if (selection.isCollapsed) {
          const { head } = selection;
          if (head.isAtStartOfNode(currentNode)) {
            preventAndStopCtx(ctx);

            // TODO: remove code highlight before deleting the code block

            const content = currentNode
              .firstChild!.children.map(cloneFrozenNode)
              .map((n) =>
                n.updateProps({
                  [ClassPathLocal]: "",
                }),
              );

            const after = PinnedSelection.fromPin(
              Pin.future(currentNode.firstChild!, 0),
            )!;
            app.cmd
              .Change(currentNode, "paragraph")
              .Change(currentNode.firstChild!, "title")
              .SetContent(currentNode.firstChild!, content)
              .Select(after)
              .Dispatch();
          }
        }
      },
    };
  }

  override handlers(): EventHandlerMap {
    return {
      selectionchange: (ctx: EventContext<any>) => {
        const { prevEvents } = ctx.app;
        const originKeydown = ["keyDown", "selectionchange"];
        if (
          isEqual(
            prevEvents.map((e) => e.type as string).slice(-2),
            originKeydown,
          )
        ) {
          if (
            isKeyHotkey("up")(
              prevEvents[prevEvents.length - 2].event as KeyboardEvent,
            )
          ) {
            // if previous selection was out of the code block
            const { selection: prevSelection } = ctx.app.state;
            if (
              prevSelection.isCollapsed &&
              !prevSelection.head.node.parents.some((n) =>
                n.eq(ctx.currentNode),
              )
            ) {
              preventAndStopCtx(ctx);
              // TODO: select the last character of the code block
              const pin = Pin.toEndOf(ctx.currentNode.firstChild!)!;
              ctx.app.cmd.Select(PinnedSelection.fromPin(pin)!).Dispatch();
              // console.log("up.....");
            }
          }
        }
      },
    };
  }

  encode(w: Writer, ne: NodeEncoder, node: Node) {
    w.write("```\n");
    node.children.map((n) => ne.encode(w, n));
    w.write("\n```");
  }

  encodeHtml(w: Writer, ne: NodeEncoder, node: Node) {
    w.write("<pre>");
    node.children.map((n) => ne.encodeHtml(w, n));
    w.write("</pre>");
  }
}
