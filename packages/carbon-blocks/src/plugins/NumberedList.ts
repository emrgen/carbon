import {Carbon, CheckedPath, Node, NodeEncoder, NodeSpec, SerializedNode, Writer} from "@emrgen/carbon-core";
import { Section } from "./Section";
import { takeBefore } from "@emrgen/carbon-core/src/utils/array";
import {encodeHtmlNestableChildren, encodeNestableChildren, node} from "@emrgen/carbon-blocks";


declare module '@emrgen/carbon-core' {
  export interface Transaction {
  }
}

export class NumberedList extends Section {
  name = 'numberList'

  spec(): NodeSpec {
    return {
      ...super.spec(),
      splitName: 'numberList',
      depends:{
        prev: true,
      },
      info: {
        title: 'Numbered List',
        description: 'Create a numbered list',
        icon: 'numberList',
        tags: ['numbered list', 'ordered list', 'ol', 'ordered', 'list', 'numbered'],
        order: 4,
      },
      props: {
        local: {
          placeholder: {
            empty: 'List',
            focused: 'Type "/" for commands',
          },
          html: {
            suppressContentEditableWarning: true,
          }
        },
        remote: {
          state: {
            listNumber: null,
          }
        }
      }
    }
  }

  commands(): Record<string, Function> {
    return {
    }
  }

  static listNumber(node: Node): number {
    const prevSiblings = takeBefore(node.prevSiblings.slice().reverse(), (n: Node) => n.name !== this.name);
    return prevSiblings.length + 1;
  }

  encode(writer: Writer, encoder: NodeEncoder<string>, node: Node) {
    writer.write('\n');
    const listNumber = NumberedList.listNumber(node);
    if (node.firstChild) {
      writer.write(writer.meta.get('indent') ?? '');
      writer.write(`${listNumber}. `);
      encoder.encode(writer, node.firstChild);
    }

    encodeNestableChildren(writer, encoder, node);
  }

  encodeHtml(w: Writer, ne: NodeEncoder<string>, node: Node) {
    w.write('<ol>');
    w.write('<li>');

    ne.encode(w, node.firstChild!);
    encodeHtmlNestableChildren(w, ne, node);

    w.write('</li>');
    w.write('</ol>');
  }
}
