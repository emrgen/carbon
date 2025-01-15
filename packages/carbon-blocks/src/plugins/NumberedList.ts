import {
  Node,
  NodeEncoder,
  NodeSpec,
  takeUntil,
  Writer,
} from "@emrgen/carbon-core";
import { encodeHtmlNestableChildren, encodeNestableChildren } from "./Nestable";
import { Section } from "./Section";

declare module "@emrgen/carbon-core" {
  export interface Transaction {}
}

export class NumberedList extends Section {
  static kind = "numberList";

  name = "numberList";

  spec(): NodeSpec {
    return {
      ...super.spec(),
      splitName: "numberList",
      depends: {
        prev: true,
      },
      info: {
        title: "Numbered List",
        description: "Create a numbered list",
        icon: "numberList",
        tags: [
          "numbered list",
          "ordered list",
          "ol",
          "ordered",
          "list",
          "numbered",
        ],
        order: 4,
      },
      props: {
        local: {
          placeholder: {
            empty: "List",
            focused: 'Type "/" for commands',
          },
          html: {
            suppressContentEditableWarning: true,
            className: "cnl",
          },
        },
        remote: {
          state: {
            listNumber: null,
          },
        },
      },
    };
  }

  static listNumber(node: Node): number {
    const prevSiblings = takeUntil(
      node.prevSiblings.slice().reverse(),
      (n: Node) => n.name !== "numberList",
    );
    return prevSiblings.length;
  }

  encode(writer: Writer, encoder: NodeEncoder, node: Node) {
    const prevSibling = node.prevSibling;

    if (prevSibling) {
      if (
        prevSibling?.name === "numberList" ||
        (prevSibling?.name === "title" &&
          prevSibling?.parent?.name === "numberList")
      ) {
        writer.write("\n");
      } else {
        writer.write("\n\n");
      }
    }

    const listNumber = NumberedList.listNumber(node);
    if (node.firstChild) {
      writer.write(writer.meta.get("indent") ?? "");
      writer.write(`${listNumber + 1}. `);
      encoder.encode(writer, node.firstChild);
    }

    encodeNestableChildren(writer, encoder, node);
  }

  encodeHtml(w: Writer, ne: NodeEncoder, node: Node) {
    w.write("<ol>");
    w.write("<li>");

    ne.encode(w, node.firstChild!);
    encodeHtmlNestableChildren(w, ne, node);

    w.write("</li>");
    w.write("</ol>");
  }
}
