import { Carbon, Node, NodeSpec, SerializedNode } from "@emrgen/carbon-core";
import { Section } from "./Section";
import { takeBefore } from "@emrgen/carbon-core/src/utils/array";


declare module '@emrgen/carbon-core' {
  export interface CarbonCommands {
    numberedList  : {
      listNumber(node: Node): number;
    };
  }
}

export class NumberedList extends Section {
  name = 'numberedList'

  spec(): NodeSpec {
    return {
      ...super.spec(),
      splitName: 'numberedList',
      info: {
        title: 'Numbered List',
        description: 'Create a numbered list',
        icon: 'numberedList',
        tags: ['numbered list', 'ordered list', 'ol', 'ordered', 'list', 'numbered'],
        order: 4,
      },
      attrs: {
        node: {
          placeholder: 'List',
        },
        html: {
          placeholder: 'List',
          // contentEditable: false,
          suppressContentEditableWarning: true,
        }
      }
    }
  }

  commands(): Record<string, Function> {
    return {
      listNumber: this.listNumber,
    }
  }

  listNumber(app: Carbon, node: Node): number {
    const prevSiblings = takeBefore(node.prevSiblings.slice().reverse(), (n: Node) => n.name !== this.name);
    return prevSiblings.length + 1;
  }

  serialize(app: Carbon, node: Node): SerializedNode {
    const contentNode = node.child(0);

    let ret = `${this.listNumber(app, node)}. ${contentNode ? app.serialize(contentNode) : ''}`;
    ret += app.cmd.nestable.serializeChildren(node);
    return ret
  }
}
