import { CarbonPlugin, NodeSpec } from "@emrgen/carbon-core";

export class Callout extends CarbonPlugin {
  name = 'callout';

  spec(): NodeSpec {
    return {
      group: 'content nestable',
      content: 'title content*',
      splits: true,
      splitName: 'section',
      selectable: true,
      draggable: true,
      dragHandle: true,
      rectSelectable: true,
      blockSelectable: true,
      info: {
        title: 'Callout',
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
