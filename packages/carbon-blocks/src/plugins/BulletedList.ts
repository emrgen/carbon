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
      attrs: {
        node: {
          emptyPlaceholder: 'List',
        },
        html: {
          placeholder: 'List',
          suppressContentEditableWarning: true,
        }
      }
    }
  }

  serialize(app: Carbon, node: Node): SerializedNode {
    const contentNode = node.child(0);
    let ret = `- ${contentNode ? app.serialize(contentNode) : ''}`;
    ret += app.cmd.nestable.serializeChildren(node);

    return ret
  }
}
