import { CarbonPlugin, NodeSpec } from "@emrgen/carbon-core";

export class Quote extends CarbonPlugin {
  name = 'quote';

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
        title: 'Quote',
        description: 'Write a quote',
        icon: 'quote',
        tags: ['quote', 'blockquote', 'q', 'cite', 'quotation', 'epigraph']
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
