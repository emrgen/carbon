import { CarbonPlugin, NodeSpec } from "@emrgen/carbon-core";

export class Cell extends CarbonPlugin {
  name = "cell";

  spec(): NodeSpec {
    return {
      group: "content block",
      sandbox: true,
      // content: "cellView cellCode",
      insertFocus: true,
      control: {
        insert: true,
        collapse: true,
      },
      dnd: {
        draggable: true,
        handle: true,
      },
      selection: {
        block: true,
        rect: true,
      },
      info: {
        title: "Cell",
        description: "Just a cell",
        icon: "cell",
        tags: ["cell"],
        order: 100,
      },
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
    return [];
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
