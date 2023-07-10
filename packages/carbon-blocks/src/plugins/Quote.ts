import { CarbonPlugin, NodeSpec } from "@emrgen/carbon-core";

export class Quote extends CarbonPlugin {
  name = 'quote';

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
        title: 'Quote',
      },
      attrs: {
        node: {
          focusPlaceholder: 'Quote',
          emptyPlaceholder: '',
        },
        html: {
          suppressContentEditableWarning: true,
        }
      }
    }
  }

}
