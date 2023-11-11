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
      insert: true,
      info: {
        title: 'Divider',
        description: 'A horizontal line to separate content',
        icon: 'divider',
        tags: ['divider', 'line', 'horizontal line'],
        order: 10
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
    return '---'
  }

}
