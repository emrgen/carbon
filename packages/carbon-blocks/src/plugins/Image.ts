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
      rectSelectable: true,
      info: {
        title: 'Divider',
      },
      attrs: {
        html: {
          suppressContentEditableWarning: true,
          contentEditable: false,
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
    return {
      name: node.name,
      title: `![](${node.attrs.node.src})`,
      content: [],
      isNested: false,
    }
  }

}
