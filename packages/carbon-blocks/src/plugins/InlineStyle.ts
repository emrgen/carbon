import { CarbonPlugin, NodePlugin, NodeSpec } from "@emrgen/carbon-core";
import { merge } from "lodash";

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
}

class CodeSpanPlugin extends InlinePlugin {
  name = "codespan";

  spec(): NodeSpec {
    return merge(super.spec(), {
      props: {
        plugin: {
          tag: "code",
        },
      },
    });
  }
}

class LinkPlugin extends InlinePlugin {
  name = "link";
}

class BoldPlugin extends InlinePlugin {
  name = "bold";

  constructor() {
    super("b");
  }
}

class ItalicPlugin extends InlinePlugin {
  name = "italic";

  constructor() {
    super("em");
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
}

class StrikethroughPlugin extends InlinePlugin {
  name = "strike";

  constructor() {
    super("strike");
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
