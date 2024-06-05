import { CarbonPlugin, NodeSpec } from "@emrgen/carbon-core";

export class Video extends CarbonPlugin {
  name = "sqVideo";

  spec(): NodeSpec {
    return {
      group: "sqItem sqColumnItem sqCard",
      content: "sqTitle",
      isolate: true,
      props: {
        local: {
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
