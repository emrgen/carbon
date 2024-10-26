import {
  AfterPlugin,
  CarbonPlugin,
  EventHandlerMap,
  Node,
  NodeEncoder,
  NodePlugin,
  NodeSpec,
  Writer,
} from "@emrgen/carbon-core";
import { encodeHtmlNestableChildren, encodeNestableChildren } from "./Nestable";

export class Header extends AfterPlugin {
  name = "header";

  plugins(): CarbonPlugin[] {
    return [1, 2, 3, 4].map((n) => new Heading(n));
  }
}

export class Heading extends NodePlugin {
  level: number;

  static isHeading(node: Node) {
    return node.groups.includes("heading");
  }

  description() {
    const { level } = this;
    switch (level) {
      case 1:
        return "Create a large heading";
      case 2:
        return "Create a medium heading";
      case 3:
        return "Create a small heading";
      case 4:
        return "Create a tiny heading";
      default:
        return "Create a heading";
    }
  }

  spec(): NodeSpec {
    return {
      group: "content nestable heading",
      content: "title content*",
      insert: true,
      splits: true,
      splitName: "section",
      split: {
        name: "section",
      },
      dnd: {
        draggable: true,
        container: true,
        handle: true,
      },
      selection: {
        inline: true,
        rect: true,
      },
      info: {
        title: `Heading ${this.level}`,
        description: this.description(),
        icon: "h" + this.level,
        tags: ["heading", "h" + this.level],
        order: 2,
      },
      props: {
        local: {
          placeholder: {
            empty: `Heading ${this.level}`,
            focused: `Heading ${this.level}`,
          },
          html: {
            suppressContentEditableWarning: true,
          },
        },
      },
    };
  }

  constructor(level: number) {
    super();
    this.name = "h" + level;
    this.level = level;
  }

  plugins(): CarbonPlugin[] {
    return [];
  }

  keydown(): Partial<EventHandlerMap> {
    return {};
  }

  encode(w: Writer, ne: NodeEncoder, node: Node) {
    const { level } = this;
    w.write("\n\n");
    w.write("#".repeat(level) + " ");
    const { firstChild } = node;
    if (firstChild) {
      ne.encode(w, firstChild);
    }

    encodeNestableChildren(w, ne, node, "");
  }

  encodeHtml(w: Writer, ne: NodeEncoder, node: Node) {
    const { level } = this;
    w.write("<h" + level + ">");
    const { firstChild } = node;
    if (firstChild) {
      ne.encodeHtml(w, firstChild);
    }
    w.write("</h" + level + ">");

    encodeHtmlNestableChildren(w, ne, node);
  }
}
