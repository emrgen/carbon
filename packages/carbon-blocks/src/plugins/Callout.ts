import {Carbon, CarbonPlugin, Node, NodeEncoder, NodeSpec, SerializedNode, Writer} from "@emrgen/carbon-core";
import {encodeNestableChildren} from "@emrgen/carbon-blocks";

export class Callout extends CarbonPlugin {
  name = 'callout';

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
        title: 'Callout',
        description: 'Write a callout',
        icon: 'callout',
        tags: ['callout', "side note", ]
      },
      props: {
        local: {
          placeholder: {
            empty: '',
            focused: 'Press / for commands'
          },
          html: {
            suppressContentEditableWarning: true,
          }
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
      encoder.encode(writer, node.firstChild);
    }

    encodeNestableChildren(writer, encoder, node, '')
  }


  encodeHtml(w: Writer, ne: NodeEncoder, node: Node) {
    w.write('<aside>');

    w.write('<p>');
    ne.encode(w, node.firstChild!);
    w.write('</p>');

    encodeNestableChildren(w, ne, node);

    w.write('</aside>');
  }

}
