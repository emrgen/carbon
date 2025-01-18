import {
  CarbonPlugin,
  EmptyPlaceholderPath,
  EventContext,
  EventHandlerMap,
  FocusedPlaceholderPath,
  Node,
  NodeEncoder,
  NodeSpec,
  preventAndStopCtx,
  RemoteDataAsPath,
  Writer,
} from "@emrgen/carbon-core";
import { encodeNestableChildren } from "./Nestable";

export class Callout extends CarbonPlugin {
  name = "callout";

  spec(): NodeSpec {
    return {
      group: "content nestable",
      content: "title content*",
      splits: true,
      splitInside: true,
      splitName: "paragraph",
      insert: true,
      weakEnd: true,
      split: {
        name: "paragraph",
      },
      dnd: {
        draggable: true,
        container: true,
        handle: true,
      },
      selection: {
        block: true,
        inline: true,
        rect: true,
      },
      info: {
        title: "Callout",
        description: "Write a callout",
        icon: "callout",
        tags: ["callout", "side note"],
      },
      props: {
        local: {
          placeholder: {
            empty: "",
            focused: "Press / for commands",
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
      enter(ctx: EventContext<KeyboardEvent>) {
        const { app, selection, currentNode } = ctx;
        console.log("[Enter] callout");
        // if selection is within the collapsible node title split the collapsible node
        if (
          selection.inSameNode &&
          selection.start.node.parent?.eq(currentNode) &&
          !currentNode.isEmpty
        ) {
          preventAndStopCtx(ctx);
          app.cmd.collapsible.split(selection)?.Dispatch();
        }
      },
      backspace: (ctx: EventContext<KeyboardEvent>) => {
        const { selection, currentNode, cmd } = ctx;

        // change callout props datka-as
        if (
          selection.isCollapsed &&
          selection.head.isAtStartOfNode(currentNode) &&
          currentNode.name === this.name &&
          currentNode.props.get(RemoteDataAsPath, "").match(/h[1-9]/)
        ) {
          ctx.stopPropagation();
          console.log(
            "xxxxxxxxxxxxxxx",
            this.props.get(FocusedPlaceholderPath),
          );
          ctx.cmd
            .Update(currentNode, {
              [RemoteDataAsPath]: "",
              [FocusedPlaceholderPath]: this.props.get(FocusedPlaceholderPath),
              [EmptyPlaceholderPath]: this.props.get(EmptyPlaceholderPath),
            })
            .Select(selection)
            .Dispatch();

          return;
        }
      },
    };
  }

  encode(writer: Writer, encoder: NodeEncoder, node: Node) {
    if (node.isEmpty) {
      return;
    }

    const prevSibling = node.prevSibling;

    if (prevSibling) {
      if (
        prevSibling?.name === "callout" ||
        (prevSibling?.name === "title" &&
          prevSibling?.parent?.name === "callout")
      ) {
        writer.write("\n");
      } else {
        writer.write("\n\n");
      }
    }

    if (node.firstChild) {
      writer.write(writer.meta.get("indent") ?? "");
      encoder.encode(writer, node.firstChild);
    }

    encodeNestableChildren(writer, encoder, node, "");
  }

  encodeHtml(w: Writer, ne: NodeEncoder, node: Node) {
    w.write("<aside>");

    w.write("<p>");
    ne.encode(w, node.firstChild!);
    w.write("</p>");

    encodeNestableChildren(w, ne, node);

    w.write("</aside>");
  }
}
