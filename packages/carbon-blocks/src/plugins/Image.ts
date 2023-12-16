import { NodePlugin, NodeSpec, EventHandler, skipKeyEvent, Node, SerializedNode, Carbon } from '@emrgen/carbon-core';

export class Image extends NodePlugin {

  name = 'image';

  spec(): NodeSpec {
    return {
      group: 'content',
      atom: true,
      isolating: true,
      selectable: true,
      draggable: true,
      dragHandle: true,
      insert: true,
      rectSelectable: true,
      blockSelectable: true,
      info: {
        title: 'Image',
        description: 'Insert an image',
        icon: 'image',
        tags: ['image', 'photo', 'picture'],
      },
      attrs: {
        html: {
          suppressContentEditableWarning: true,
          contentEditable: false,
        },
        node: {
          justiFyContent: 'center',
        }
      }
    }
  }

  keydown(): Partial<EventHandler> {
    return {
      tab: skipKeyEvent
    }
  }

  serialize(app: Carbon, node: Node): SerializedNode {
    return `![](${node.attrs.node.src})`;
  }

}
