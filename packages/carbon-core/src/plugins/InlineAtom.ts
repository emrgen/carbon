import { CarbonPlugin, NodeSpec } from "@emrgen/carbon-core";

export class InlineAtom extends CarbonPlugin {
  name = "inlineAtom";

  override spec(): NodeSpec {
    return {
      group: "inline",
      inline: true,
      inlineSelectable: true,
      // hint that the node is focusable (cursor can be placed wrt this node)
      focusable: true,
      atom: true,
      tag: "span",
    };
  }
}
