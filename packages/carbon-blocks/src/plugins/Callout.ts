import { CarbonPlugin, NodeSpec } from "@emrgen/carbon-core";

export class Callout extends CarbonPlugin {
  name = 'callout';

  spec(): NodeSpec {
    return {
      group: 'content nestable',
      content: 'title content*',
      splits: true,
      splitName: 'section',
      insert: true,
      selectable: true,
      draggable: true,
      dragHandle: true,
      rectSelectable: true,
      blockSelectable: true,
      info: {
        title: 'Callout',
        description: 'Write a callout',
        icon: 'callout'
      },
      attrs: {
        node: {
          focusPlaceholder: 'Callout',
          emptyPlaceholder: '',
        },
        html: {
          suppressContentEditableWarning: true,
        }
      }
    }
  }

}
