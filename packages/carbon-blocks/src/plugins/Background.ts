import { NodePlugin, NodeSpec } from "@emrgen/carbon-core";

export class BackgroundColorPlugin extends NodePlugin {
  name = "bgColor";

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
