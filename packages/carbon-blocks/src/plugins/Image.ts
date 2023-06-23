import { NodePlugin, NodeSpec, EventHandler, skipKeyEvent } from '@emrgen/carbon-core';

export class Image extends NodePlugin {

  name = 'image';

  spec(): NodeSpec {
    return {
      group: 'content nestable',
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

}
