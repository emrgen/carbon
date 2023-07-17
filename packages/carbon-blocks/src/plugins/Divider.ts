import { NodePlugin, NodeSpec, EventHandler, skipKeyEvent, Carbon, SerializedNode, Node } from '@emrgen/carbon-core';

export class Divider extends NodePlugin {

  name = 'divider';

  spec(): NodeSpec {
    return {
      group: 'content nestable',
      atom: true,
      isolating: true,
      selectable: true,
      draggable: true,
      dragHandle: true,
      rectSelectable: true,
      blockSelectable: true,
      info: {
        title: 'Divider',
      },
      attrs: {
        html: {
          suppressContentEditableWarning: true,
          // contentEditable: false,
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
      content: [],
      isNested: false,
    }
  }

}
