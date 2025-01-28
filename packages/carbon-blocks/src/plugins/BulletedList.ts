import { Node, NodeEncoder, NodeSpec, Writer } from "@emrgen/carbon-core";
import { encodeHtmlNestableChildren, encodeNestableChildren } from "./Nestable";
import { Paragraph } from "./Paragraph";

export class BulletedList extends Paragraph {
  name = "bulletList";

  static create<T>(): BulletedList {
    return new BulletedList();
  }

  spec(): NodeSpec {
    return {
      ...super.spec(),
      tag: "div",
      splitName: "bulletList",
      split: {
        name: "bulletList",
      },
      dnd: {
        nestable: true,
        handle: true,
        draggable: true,
      },
      info: {
        title: "Bulleted List",
        shortcut: "-",
        description: "Create a bulleted list",
        icon: "bulletList",
        tags: ["bulleted list", "unordered list", "list", "ul", "unordered"],
        order: 3,
      },
      props: {
        local: {
          placeholder: {
            empty: "List",
            focused: "Press / for commands",
          },
          html: {
            suppressContentEditableWarning: true,
            className: "cbl",
          },
        },
      },
    };
  }

  encode(writer: Writer, encoder: NodeEncoder, node: Node) {
    const prevSibling = node.prevSibling;
    if (prevSibling) {
      if (
        prevSibling?.name === "bulletList" ||
        (prevSibling?.name === "title" && prevSibling?.parent?.name === "bulletList")
      ) {
        writer.write("\n");
      } else {
        writer.write("\n\n");
      }
    }

    if (node.firstChild) {
      writer.write(writer.meta.get("indent") ?? "");
      writer.write("- ");
      encoder.encode(writer, node.firstChild);
    }

    encodeNestableChildren(writer, encoder, node);
  }

  encodeHtml(w: Writer, ne: NodeEncoder, node: Node) {
    w.write("<ul>\n");
    w.write("<li>\n");

    ne.encode(w, node.firstChild!);
    encodeHtmlNestableChildren(w, ne, node, "");

    w.write("\n</li>");
    w.write("\n</ul>");
  }
}
