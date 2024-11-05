import { CarbonPlugin, NodeSpec } from "@emrgen/carbon-core";

export class Heading extends CarbonPlugin {
  name = "sqHeading";

  spec(): NodeSpec {
    return {
      group: "sqItem sqColumnItem sqCard",
      content: "paragraph (paragraph)*",
      isolate: true,
      props: {
        local: {
          placeholder: {
            empty: "Start typing...",
            focused: "Start typing...",
          },
          html: {
            suppressContentEditableWarning: true,
            className: "sqItem",
            contentEditable: false,
          },
        },
      },
    };
  }
}
