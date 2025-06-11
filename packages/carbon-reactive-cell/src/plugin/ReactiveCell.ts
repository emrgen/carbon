import { CarbonPlugin, NodeSpec } from "@emrgen/carbon-core";

export class LiveCell extends CarbonPlugin {
  name = "liveCell";

  spec(): NodeSpec {
    return {
      group: "content",
      sandbox: true,
      insert: true,
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
        title: "LiveCell",
        description: "LiveCell for reactive programming",
        icon: "liveCell",
        tags: ["cell", "live", "reactive"],
        order: 100,
      },
      props: {
        local: {
          placeholder: {
            empty: "LiveCell",
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
}
