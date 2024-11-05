import { CarbonPlugin, NodeSpec } from "@emrgen/carbon-core";

export class Continue extends CarbonPlugin {
  name = "continue";

  spec(): NodeSpec {
    return {
      group: "content",
      content: "button button?",
      isolate: true,
      dnd: {
        draggable: true,
        handle: true,
      },
      props: {
        local: {
          html: {
            contentEditable: false,
            suppressContentEditableWarning: true,
          },
        },
      },
    };
  }
}