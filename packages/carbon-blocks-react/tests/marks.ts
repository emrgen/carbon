import { NodePlugin, NodeSpec } from "@emrgen/carbon-core";

class MarkPlugin extends NodePlugin {
  spec(): NodeSpec {
    return {
      group: "mark",
      content: "(mark|inline)+", // inline content
      inline: true,
    };
  }
}

export class Bold extends MarkPlugin {
  name = "bold";
}
export class Italic extends MarkPlugin {
  name = "italic";
}
export class Color extends MarkPlugin {
  name = "color";
}
