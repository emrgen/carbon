import {Carbon, CarbonPlugin, Node, NodeEncoder, NodeSpec, SerializedNode, Writer} from "@emrgen/carbon-core";
import { Section } from "./Section";
import {encodeHtmlNestableChildren, encodeNestableChildren} from "@emrgen/carbon-blocks";

export class BulletedList extends Section {
  name = 'bulletList'

  spec(): NodeSpec {
    return {
      ...super.spec(),
      splitName: 'bulletList',
      info: {
        title: 'Bulleted List',
        description: 'Create a bulleted list',
        icon: 'bulletList',
        tags: ['bulleted list', 'unordered list', 'list', 'ul', 'unordered'],
        order: 3,
      },
      props: {
        local: {
          placeholder: {
            empty: 'List',
            focused: 'Press / for commands',
          },
          html: {
            suppressContentEditableWarning: true,
          }
        }
      }
    }
  }

  encode(writer: Writer, encoder: NodeEncoder, node: Node) {
    const prevSibling = node.prevSibling;
    if (prevSibling) {
      writer.write('\n');
    }
    if (node.firstChild) {
      writer.write(writer.meta.get('indent') ?? '');
      writer.write('- ');
      encoder.encode(writer, node.firstChild);
    }

    encodeNestableChildren(writer, encoder, node);
  }

  encodeHtml(w: Writer, ne: NodeEncoder, node: Node) {
    w.write('<ul>\n');
    w.write('<li>\n');

    ne.encode(w, node.firstChild!);
    encodeHtmlNestableChildren(w, ne, node, '');

    w.write('\n</li>');
    w.write('\n</ul>');
  }

}
