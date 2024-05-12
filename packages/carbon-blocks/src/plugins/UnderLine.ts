import { NodePlugin, NodeSpec } from "@emrgen/carbon-core";

export class UnderLinePlugin extends NodePlugin {
  name = "underline";

  spec(): NodeSpec {
    return {
      content: "inline+",
      inline: true,
      inlineSelectable: true,
      focusable: true,
      attrs: {
        html: {
          suppressContentEditableWarning: true,
        },
        node: {},
      },
    };
  }
}
