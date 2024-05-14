import {
  CarbonPlugin,
  LinkPath,
  Node,
  NodeEncoder,
  NodePlugin,
  NodeSpec,
  TextWriter,
  Writer,
} from "@emrgen/carbon-core";

export class InlineStylePlugin extends NodePlugin {
  name = "inlineStyle";

  plugins(): CarbonPlugin[] {
    return [
      new BoldPlugin(),
      new ItalicPlugin(),
      new TextColorPlugin(),
      new BackgroundColorPlugin(),
      new UnderlinePlugin(),
      new StrikethroughPlugin(),
      new SubscriptPlugin(),
      new SuperscriptPlugin(),
      new LinkPlugin(),
      new CodeSpanPlugin(),
    ];
  }
}

//
class InlinePlugin extends NodePlugin {
  name = "bold";

  private readonly tag: string;

  constructor(tag: string = "span") {
    super();
    this.tag = tag;
  }

  spec(): NodeSpec {
    return {
      content: "inline+",
      inline: true,
      inlineSelectable: true,
      focusable: false,
      props: {
        plugin: {
          tag: this.tag,
        },
        local: {},
      },
    };
  }

  encodeInline(
    w: Writer,
    ne: NodeEncoder,
    node: Node,
    open: string,
    close: string = open,
  ) {
    const writer = new TextWriter();
    node.children.map((n) => ne.encode(writer, n));

    const text = writer.toString();
    const prefix = text.match(/^\s+(.*)?/);
    const suffix = text.match(/(.*)?(\s+)$/);

    if (prefix) {
      w.write(prefix[2]);
    }

    w.write(open);
    // console.log(prefix, suffix, text);

    w.write(text.trim());

    w.write(close);
    if (suffix) {
      w.write(suffix[2]);
    }
  }

  encode(w: Writer, ne: NodeEncoder, node: Node) {
    this.encodeInline(w, ne, node, "");
  }
}

class CodeSpanPlugin extends InlinePlugin {
  name = "codespan";

  constructor() {
    super("code");
  }

  encode(w: Writer, ne: NodeEncoder, node: Node) {
    this.encodeInline(w, ne, node, "`");
  }
}

class LinkPlugin extends InlinePlugin {
  name = "link";

  encode(w: Writer, ne: NodeEncoder, node: Node) {
    this.encodeInline(w, ne, node, "[", `](${node.props.get(LinkPath, "")})`);
  }
}

class BoldPlugin extends InlinePlugin {
  name = "bold";

  constructor() {
    super("b");
  }

  encode(w: Writer, ne: NodeEncoder, node: Node) {
    this.encodeInline(w, ne, node, "**");
  }
}

class ItalicPlugin extends InlinePlugin {
  name = "italic";

  constructor() {
    super("em");
  }

  encode(w: Writer, ne: NodeEncoder, node: Node) {
    this.encodeInline(w, ne, node, "*");
  }
}

class TextColorPlugin extends InlinePlugin {
  name = "color";
}

class BackgroundColorPlugin extends InlinePlugin {
  name = "background";
}

class UnderlinePlugin extends InlinePlugin {
  name = "underline";

  constructor() {
    super("u");
  }

  encode(w: Writer, ne: NodeEncoder, node: Node) {
    this.encodeInline(w, ne, node, "__");
  }
}

class StrikethroughPlugin extends InlinePlugin {
  name = "strike";

  constructor() {
    super("strike");
  }

  encode(w: Writer, ne: NodeEncoder, node: Node) {
    this.encodeInline(w, ne, node, "~");
  }
}

class SubscriptPlugin extends InlinePlugin {
  name = "subscript";

  constructor() {
    super("sub");
  }
}

class SuperscriptPlugin extends InlinePlugin {
  name = "superscript";

  constructor() {
    super("sup");
  }
}
