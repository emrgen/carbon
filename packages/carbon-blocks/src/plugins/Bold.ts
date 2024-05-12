import { NodePlugin, NodeSpec } from "@emrgen/carbon-core";

export class BoldPlugin extends NodePlugin {
  name = "bold";

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
