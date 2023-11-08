import { Carbon, CarbonPlugin, Node, NodeSpec, SerializedNode } from "@emrgen/carbon-core";

export class Callout extends CarbonPlugin {
  name = 'callout';

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
        title: 'Callout',
        description: 'Write a callout',
        icon: 'callout',
        tags: ['callout', "side note", ]
      },
      attrs: {
        node: {
          focusPlaceholder: 'Callout',
          emptyPlaceholder: '',
        },
        html: {
          suppressContentEditableWarning: true,
        }
      }
    }
  }

  serialize(app: Carbon, node: Node): SerializedNode {
    const contentNode = node.child(0);

    let ret = `${contentNode ? app.serialize(contentNode) : ''}`;
    ret += app.cmd.nestable.serializeChildren(node);
    return ret
  }

}
