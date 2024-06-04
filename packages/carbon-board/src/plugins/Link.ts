import { CarbonPlugin, NodeSpec } from "@emrgen/carbon-core";

export class Link extends CarbonPlugin {
  name = "sqLink";

  spec(): NodeSpec {
    return {
      group: "sqItem sqColumnItem sqCard",
      content: "sqTitle",
      isolate: true,
      props: {
        local: {
          placeholder: {
            empty: "Add a caption",
            focused: "",
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
