import { encodeHtmlNestableChildren, encodeNestableChildren } from "@emrgen/carbon-blocks";
import {
  Carbon,
  CarbonAction,
  CarbonPlugin,
  Node,
  NodeEncoder,
  NodePlugin,
  NodeSpec,
  SerializedNode,
  Writer,
} from "@emrgen/carbon-core";
import { Optional } from "@emrgen/types";

import { TitlePlugin } from "./Title";

declare module "@emrgen/carbon-core" {
  export interface Transaction {
    paragraph: {
      insert: (after: Node) => Optional<Transaction>;
    };
  }
}

export class Paragraph extends NodePlugin {
  name = "paragraph";

  static create<T>(): Paragraph {
    return new Paragraph();
  }

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
        move: "xy",
      },
      selection: {
        rect: true,
        block: true,
        inline: true,
      },
      info: {
        title: "Text",
        description: "Just start typing to create a new paragraph",
        icon: "paragraph",
        tags: ["text", "paragraph", "paragraph", "p"],
        order: 1,
      },
      props: {
        local: {
          placeholder: {
            // TODO: This is a hack to get the correct placeholder for empty paragraph
            // not empty placeholder is not removed from node props.
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

  commands(): Record<string, Function> {
    return {};
  }

  plugins(): CarbonPlugin[] {
    return [new TitlePlugin()];
  }

  serialize(app: Carbon, node: Node): SerializedNode {
    const contentNode = node.child(0);

    let ret = contentNode?.textContent;

    // TODO: This is a hack to get the correct heading level
    switch (node.props.get("html.data-as")) {
      case "h1":
        ret = "# " + ret;
        break;
      case "h2":
        ret = "## " + ret;
        break;
      case "h3":
        ret = "### " + ret;
        break;
      case "h4":
        ret = "#### " + ret;
        break;
    }

    return ret + app.cmd.nestable.serializeChildren(node);
  }

  normalize(node: Node): CarbonAction[] {
    console.log("normalize paragraph", node.children.length);
    console.warn("normalize section", node.children.length);
    if (node.isEmpty) {
      // const actions = SetContentAction.create(node.firstChild!, [
      //   this.app.schema.nodeFromJSON(text('hello world')!)!
      // ]);
      // return [RemoveNodeAction.create(nodeLocation(node)!, node.id, node.toJSON())];
    }

    return [];
  }

  // encode into markdown
  encode(writer: Writer, encoder: NodeEncoder, node: Node) {
    if (node.isEmpty) {
      return;
    }

    const prevSibling = node.prevSibling;
    if (prevSibling) {
      writer.write("\n\n");
    }

    if (node.firstChild) {
      writer.write(writer.meta.get("indent") ?? "");
      encoder.encode(writer, node.firstChild);
    }

    encodeNestableChildren(writer, encoder, node, "");
  }

  // encode into html
  encodeHtml(w: Writer, ne: NodeEncoder, node: Node) {
    if (node.isEmpty) {
      return;
    }

    if (node.firstChild) {
      w.write("<p>");
      ne.encodeHtml(w, node.firstChild);
      w.write("</p>");
    }

    encodeHtmlNestableChildren(w, ne, node);
  }
}
