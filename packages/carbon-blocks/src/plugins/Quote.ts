import {
  CarbonPlugin,
  Node,
  NodeEncoder,
  NodeSpec,
  Writer,
} from "@emrgen/carbon-core";
import { encodeNestableChildren } from "./Nestable";

export class Quote extends CarbonPlugin {
  name = "quote";

  spec(): NodeSpec {
    return {
      group: "content nestable",
      content: "title content*",
      splits: true,
      splitName: "paragraph",
      insert: true,
      dnd: {
        draggable: true,
        handle: true,
        container: true,
      },
      selection: {
        rect: true,
        block: true,
        inline: true,
      },
      info: {
        title: "Quote",
        shortcut: "|",
        description: "Write a quote",
        icon: "quote",
        tags: [
          "quote",
          "blockquote",
          "q",
          "cite",
          "quotation",
          "epigraph",
          "excerpt",
          "citation",
        ],
      },
      props: {
        local: {
          placeholder: {
            empty: "Empty quote",
            focused: "",
          },
          html: {
            suppressContentEditableWarning: true,
          },
        },
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
      writer.write("> ");
      encoder.encode(writer, node.firstChild);
    }

    encodeNestableChildren(writer, encoder, node, "> ");
  }

  encodeHtml(w: Writer, ne: NodeEncoder, node: Node) {
    w.write("<blockquote>");
    w.write("<p>");

    ne.encode(w, node.firstChild!);
    encodeNestableChildren(w, ne, node);

    w.write("</p>");
    w.write("</blockquote>");
  }
}
