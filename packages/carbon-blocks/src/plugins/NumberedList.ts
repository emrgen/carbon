import { Carbon, Node, NodeSpec, SerializedNode } from "@emrgen/carbon-core";
import { Section } from "./Section";
import { takeBefore } from "@emrgen/carbon-core/src/utils/array";


declare module '@emrgen/carbon-core' {
  export interface Transaction {
  }
}

export class NumberedList extends Section {
  name = 'numberedList'

  spec(): NodeSpec {
    return {
      ...super.spec(),
      splitName: 'numberedList',
      depends:{
        prev: true,
      },
      info: {
        title: 'Numbered List',
        description: 'Create a numbered list',
        icon: 'numberedList',
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

  // serialize(react: Carbon, node: Node): SerializedNode {
  //   const contentNode = node.child(0);
  //
  //   let ret = `${NumberedList.listNumber(node)}. ${contentNode ? react.serialize(contentNode) : ''}`;
  //   // ret += react.cmd.nestable.serializeChildren(node);
  //   return ret
  // }
}
