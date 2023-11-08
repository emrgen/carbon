import {
  Carbon,
  CarbonPlugin, DeleteOpts, InsertPos,
  Node, NodeName,
  NodeSpec, Pin,
  PinnedSelection, Point,
  SerializedNode, Slice, SplitOpts,
  Transaction
} from "@emrgen/carbon-core";
import { Section } from "./Section";
import { takeBefore, takeUpto } from "@emrgen/carbon-core/src/utils/array";
import { Optional } from "@emrgen/types";


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
          emptyPlaceholder: 'List',
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

    const childrenNodes = node.children.slice(1);
    if (childrenNodes.length) {
      ret += '\n' + childrenNodes.map(n => app.serialize(n)).join('\n ');
    }

    return ret
  }
}
