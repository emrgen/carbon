import { AtomSizePath, NodePlugin, NodeSpec } from "@emrgen/carbon-core";

declare module "@emrgen/carbon-core" {
  export interface Transaction {
    newline: {};
  }
}

export class NewlinePlugin extends NodePlugin {
  name = "newline";

  spec(): NodeSpec {
    return {
      inline: true,
      atom: true,
      inlineSelectable: true,
      focusable: true,
      mergeable: true,
      tag: "span",
      props: {
        local: {
          html: {
            suppressContentEditableWarning: true,
          },
        },
        [AtomSizePath]: 1,
      },
    };
  }
}
