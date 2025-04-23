import { CarbonPlugin, NodeSpec } from "@emrgen/carbon-core";

export class Element extends CarbonPlugin {
  name = "deElement";

  spec(): NodeSpec {
    return {
      group: "deContent deElement",
      dnd: {
        draggable: true,
        handle: false,
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
          state: {
            element: {
              style: {},
            },
            transform: {
              style: {
                display: "block",
                top: "100px",
                left: "100px",
                width: "100px",
                height: "100px",
                background: "rgba(0, 0, 0, 0.2)",
                borderRadius: "6px",
              },
            },
          },
        },
      },
    };
  }
}
