import { CarbonPlugin, NodeSpec } from "@emrgen/carbon-core";

export class Transformer extends CarbonPlugin {
  name = "deTransformer";

  spec(): NodeSpec {
    return {
      group: "deElement",
      content: "deElement+",
      dnd: {
        draggable: true,
      },
      transform: {
        rotate: true,
        translate: "xy",
        resize: "xy",
      },
      props: {
        local: {
          html: {
            className: "de-element",
            contentEditable: false,
            suppressContentEditableWarning: true,
          },
        },
        remote: {
          html: {
            style: {
              display: "block",
              top: "100px",
              left: "100px",
              width: "100px",
              height: "100px",
            },
          },
        },
      },
    };
  }
}