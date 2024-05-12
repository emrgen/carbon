import { NodePlugin, NodeSpec } from "@emrgen/carbon-core";

export class StrikePlugin extends NodePlugin {
  name = "strike";

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
