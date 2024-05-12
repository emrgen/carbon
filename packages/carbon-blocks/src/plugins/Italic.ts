import { NodePlugin, NodeSpec } from "@emrgen/carbon-core";

export class ItalicPlugin extends NodePlugin {
  name = "italic";

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
