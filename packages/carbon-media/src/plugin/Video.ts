import {
  EventHandler,
  NodePlugin,
  NodeSpec,
  skipKeyEvent,
} from "@emrgen/carbon-core";

export const VideoSrcPath = "remote/state/video/src";

export class Video extends NodePlugin {
  name = "video";

  spec(): NodeSpec {
    return {
      group: "content",
      atom: true,
      isolate: true,
      insert: true,
      sandbox: true,
      dnd: {
        handle: true,
        draggable: true,
      },
      selection: {
        block: true,
        rect: true,
      },
      info: {
        title: "Video",
        description: "Insert a video",
        icon: "video",
        tags: ["video", "movie", "film"],
      },
      props: {
        local: {
          html: {
            suppressContentEditableWarning: true,
            contentEditable: false,
          },
        },
      },
      state: {
        focused: true,
      },
    };
  }

  keydown(): Partial<EventHandler> {
    return {
      tab: skipKeyEvent,
    };
  }

  // serialize(react: Carbon, node: Node): SerializedNode {
  //   return {
  //     name: node.name,
  //     title: `![](${node.attrs.node.src})`,
  //     children: [],
  //   }
  // }
}
