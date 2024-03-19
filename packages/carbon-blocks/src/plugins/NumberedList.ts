import {Carbon, CheckedPath, Node, NodeEncoder, NodeSpec, SerializedNode, Writer} from "@emrgen/carbon-core";
import { Section } from "./Section";
import {takeBefore, takeUpto} from "@emrgen/carbon-core/src/utils/array";
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
      depends: {
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

  static listNumber(node: Node): number {
    // const prevSiblings = takeUpto(node.prevSiblings.slice().reverse(), (n: Node) => n.name !== this.name);
    // console.log(prevSiblings, node.prevSiblings, node.name, node.prevSiblings.map(n => n.name));
    return 1//prevSiblings.length;
  }

  encode(writer: Writer, encoder: NodeEncoder, node: Node) {
    const prevSibling = node.prevSibling;
    if (prevSibling) {
      writer.write('\n');
    }

    const listNumber = NumberedList.listNumber(node);
    if (node.firstChild) {
      writer.write(writer.meta.get('indent') ?? '');
      writer.write(`${listNumber}. `);
      encoder.encode(writer, node.firstChild);
    }

    encodeNestableChildren(writer, encoder, node);
  }

  encodeHtml(w: Writer, ne: NodeEncoder, node: Node) {
    w.write('<ol>');
    w.write('<li>');

    ne.encode(w, node.firstChild!);
    encodeHtmlNestableChildren(w, ne, node);

    w.write('</li>');
    w.write('</ol>');
  }
}
