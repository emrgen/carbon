import {
  Carbon,
  EventHandler,
  Node,
  NodePlugin,
  NodeSpec,
  SerializedNode,
  skipKeyEvent,
} from "@emrgen/carbon-core";

export class Divider extends NodePlugin {
  name = "divider";

  spec(): NodeSpec {
    return {
      group: "content nestable",
      atom: true,
      isolate: true,
      insert: true,
      dnd: {
        handle: true,
        draggable: true,
      },
      selection: {
        block: true,
        inline: true,
        rect: true,
      },
      info: {
        title: "Divider",
        description: "A horizontal line to separate content",
        icon: "divider",
        tags: ["divider", "line", "horizontal line"],
        order: 10,
      },
      props: {
        local: {
          html: {
            suppressContentEditableWarning: true,
            contentEditable: false,
            className: "cdiv",
          },
        },
      },
    };
  }

  keydown(): Partial<EventHandler> {
    return {
      tab: skipKeyEvent,
    };
  }

  serialize(app: Carbon, node: Node): SerializedNode {
    return "---";
  }
}
