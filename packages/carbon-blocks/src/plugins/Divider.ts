import { NodePlugin, NodeSpec, EventHandler, skipKeyEvent } from '@emrgen/carbon-core';

export class Divider extends NodePlugin {

  name = 'divider';

  spec(): NodeSpec {
    return {
      group: 'content nestable',
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

}
