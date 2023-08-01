import { CarbonPlugin, EventHandler, NodeSpec, skipKeyEvent } from "@emrgen/carbon-core";

export class Separator extends CarbonPlugin {

  name = "separator";

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
