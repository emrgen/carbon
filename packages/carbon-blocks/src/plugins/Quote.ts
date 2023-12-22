import { Carbon, CarbonPlugin, Node, NodeSpec, SerializedNode } from "@emrgen/carbon-core";

export class Quote extends CarbonPlugin {
  name = 'quote';

  spec(): NodeSpec {
    return {
      group: 'content nestable',
      content: 'title content*',
      splits: true,
      splitName: 'section',
      insert: true,
      inlineSelectable: true,
      draggable: true,
      dragHandle: true,
      rectSelectable: true,
      blockSelectable: true,
      info: {
        title: 'Quote',
        description: 'Write a quote',
        icon: 'quote',
        tags: ['quote', 'blockquote', 'q', 'cite', 'quotation', 'epigraph', 'excerpt', 'citation']
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

  // serialize(app: Carbon, node: Node): SerializedNode {
  //   const content = node.child(0)!
  //   return `> ${app.serialize(content)}${app.commands.nestable.serializeChildren(node)}`;
  // }
}
