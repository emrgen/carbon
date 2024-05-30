import { CarbonPlugin, NodeSpec } from "@emrgen/carbon-core";

export class InlineAtom extends CarbonPlugin {
  name = "inlineAtom";

  override spec(): NodeSpec {
    return {
      group: "inline",
      inline: true,
      inlineSelectable: true,
      focusable: true,
      atom: true,
      tag: "span",
    };
  }
}
