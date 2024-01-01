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
            empty: 'Callout',
            focus: 'Callout'
          },
          html: {
            suppressContentEditableWarning: true,
          }
        }
      }
    }
  }

  // serialize(react: Carbon, node: Node): SerializedNode {
  //   const contentNode = node.child(0);
  //
  //   let ret = `${contentNode ? react.serialize(contentNode) : ''}`;
  //   ret += react.commands.nestable.serializeChildren(node);
  //   return ret
  // }

}
