import {
  CarbonPlugin,
  EventContext,
  EventHandlerMap,
  Node,
  NodeEncoder,
  NodeSpec,
  preventAndStopCtx,
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
      splitName: "section",
      insert: true,
      weakEnd: true,
      split: {
        name: "section",
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
    };
  }

  encode(writer: Writer, encoder: NodeEncoder, node: Node) {
    if (node.isEmpty) {
      return;
    }

    writer.write("\n\n");
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
