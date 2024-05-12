import { NodePlugin, NodeSpec } from "@emrgen/carbon-core";

export class CodeSpanPlugin extends NodePlugin {
  name = "codespan";

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
