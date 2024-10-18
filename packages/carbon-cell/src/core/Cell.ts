import { CarbonPlugin, NodeSpec } from "@emrgen/carbon-core";

export class Cell extends CarbonPlugin {
  name = "cell";

  spec(): NodeSpec {
    return {
      group: "content",
      content: "cellView cellCode",
      isolate: true,
      sandbox: true,
      props: {
        local: {
          placeholder: {
            empty: "Cell",
            focused: "Press / for commands",
          },
          html: {
            suppressContentEditableWarning: true,
            contentEditable: false,
          },
        },
      },
    };
  }

  plugins(): CarbonPlugin[] {
    return [new CellView(), new CellCode()];
  }
}

export class CellView extends CarbonPlugin {
  name = "cellView";

  spec(): NodeSpec {
    return {
      group: "block",
      isolate: true,
      props: {},
    };
  }
}

export class CellCode extends CarbonPlugin {
  name = "cellCode";

  spec(): NodeSpec {
    return {
      group: "block",
      content: "codeMirror",
      isolate: true,
      props: {},
    };
  }
}
