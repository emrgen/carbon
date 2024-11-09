import {
  EventHandler,
  NodePlugin,
  NodeSpec,
  skipKeyEvent,
} from "@emrgen/carbon-core";

export const ImageSrcPath = "remote/state/image/src";

export class Image extends NodePlugin {
  name = "image";

  spec(): NodeSpec {
    return {
      group: "content",
      atom: true,
      isolate: true,
      inlineSelectable: true,
      draggable: true,
      dragHandle: true,
      insert: true,
      rectSelectable: true,
      blockSelectable: true,
      info: {
        title: "Image",
        description: "Insert an image",
        icon: "image",
        tags: ["image", "photo", "picture"],
      },
      props: {
        local: {
          html: {
            suppressContentEditableWarning: true,
            contentEditable: false,
          },
          node: {
            justifyContent: "center",
          },
        },
        remote: {
          src: "",
        },
      },
    };
  }

  keydown(): Partial<EventHandler> {
    return {
      tab: skipKeyEvent,
    };
  }

  // serialize(react: Carbon, node: Node): SerializedNode {
  //   return `![](${node.props.node.src})`;
  // }
}
