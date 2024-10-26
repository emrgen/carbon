import { CarbonPlugin, NodeSpec } from "@emrgen/carbon-core";

export class Design extends CarbonPlugin {
  name = "deBoard";
  spec(): NodeSpec {
    return {
      group: "content",
      content: "deContent",
      isolate: true,
      dnd: {
        container: true,
        region: true,
      },
    };
  }

  plugins(): CarbonPlugin[] {
    return [new DesignShape()];
  }
}

export class DesignShape extends CarbonPlugin {
  name = "deShape";
  spec(): NodeSpec {
    return {
      group: "deContent deElement",
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
              position: "absolute",
              top: "100px",
              left: "100px",
              width: "100px",
              height: "100px",
              background: "red",
              borderRadius: "6px",
            },
          },
        },
      },
    };
  }
}