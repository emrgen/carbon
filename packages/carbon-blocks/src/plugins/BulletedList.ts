import { Carbon, CarbonPlugin, Node, NodeSpec, SerializedNode } from "@emrgen/carbon-core";
import { Section } from "./Section";

export class BulletedList extends Section {
  name = 'bulletedList'

  spec(): NodeSpec {
    return {
      ...super.spec(),
      splitName: 'bulletedList',
      info: {
        title: 'Bulleted List',
        description: 'Create a bulleted list',
        icon: 'bulletedList',
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

  // serialize(react: Carbon, node: Node): SerializedNode {
  //   const contentNode = node.child(0);
  //   let ret = `- ${contentNode ? react.serialize(contentNode) : ''}`;
  //   ret += react.commands.nestable.serializeChildren(node);
  //
  //   return ret
  // }
}
