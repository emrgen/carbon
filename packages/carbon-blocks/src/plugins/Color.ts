import { NodePlugin, NodeSpec } from "@emrgen/carbon-core";

export class TextColorPlugin extends NodePlugin {
  name = "textColor";

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
