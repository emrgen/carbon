import { Carbon, CarbonPlugin, EventHandler, NodeSpec, skipKeyEvent } from "@emrgen/carbon-core";

export class Separator extends CarbonPlugin {

  name = "separator";

  spec(): NodeSpec {
    return {
      group: 'content nestable',
      atom: true,
      isolating: true,
      inlineSelectable: true,
      draggable: true,
      dragHandle: true,
      rectSelectable: true,
      blockSelectable: true,
      insert: true,
      info: {
        title: 'Separator',
        description: 'A horizontal line to separate content',
        icon: 'separator',
        tags: ['separator', "dots", "stars", 'horizontal separator'],
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
      tab: skipKeyEvent,
    }
  }

  serialize(): string {
    return '***'
  }

}
