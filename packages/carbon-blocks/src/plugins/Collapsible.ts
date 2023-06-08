import { EventHandler, NodePlugin, NodeSpec, skipKeyEvent } from "@emrgen/carbon-core";

export class CollapsibleList extends NodePlugin {

  name = 'collapsible';

  spec(): NodeSpec {
    return {
      group: 'content nestable',
      content: 'title content*',
      container: true,
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
      // tab: skipKeyEvent
    }
  }

}
