import {Carbon, CarbonPlugin, Node, NodeEncoder, NodeSpec, SerializedNode, Writer} from "@emrgen/carbon-core";
import {encodeNestableChildren} from "@emrgen/carbon-blocks";

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

  encode(writer: Writer, encoder: NodeEncoder, node: Node) {
    if (node.isEmpty) {
      return
    }

    writer.write('\n\n');
    if (node.firstChild) {
      writer.write(writer.meta.get('indent') ?? '');
      writer.write('> ');
      encoder.encode(writer, node.firstChild);
    }

    encodeNestableChildren(writer, encoder, node, '> ');
  }

  encodeHtml(w: Writer, ne: NodeEncoder<string>, node: Node) {
    w.write('<blockquote>');
    w.write('<p>');

    ne.encode(w, node.firstChild!);
    encodeNestableChildren(w, ne, node);

    w.write('</p>');
    w.write('</blockquote>');
  }
}
