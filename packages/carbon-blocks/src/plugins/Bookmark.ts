import { CarbonPlugin, NodeSpec } from "@emrgen/carbon-core";

export class Bookmark extends CarbonPlugin {
  name = "bookmark";

  spec(): NodeSpec {
    return {
      group: "content",
      isolate: true,
      props: {
        local: {
          html: {
            contentEditable: false,
          },
        },
      },
    };
  }
}
