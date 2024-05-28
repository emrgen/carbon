import {
  CarbonPlugin,
  ClassPathLocal,
  cloneFrozenNode,
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
      // enter: (ctx: EventContext<any>) => {
      //   const { app } = ctx;
      //   const { selection } = ctx.app.state;
      //   // insert a new line into the title
      //   if (selection.isCollapsed) {
      //     preventAndStopCtx(ctx);
      //     app.cmd.transform.insertText(selection, "\n").Dispatch();
      //   }
      // },
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
              .Change(currentNode, "section")
              .Change(currentNode.firstChild!, "title")
              .SetContent(currentNode.firstChild!, content)
              .Select(after)
              .Dispatch();
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
