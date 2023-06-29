import { Carbon, CarbonPlugin, Node, NodeSpec, SerializedNode } from "@emrgen/carbon-core";
import { Section } from "./Section";

export class Todo extends Section {
  name = 'todo'

  spec(): NodeSpec {
    return {
      ...super.spec(),
      splitName: 'todo',
      info: {
        title: 'Task'
      },
      attrs: {
        node: {
          emptyPlaceholder: 'To-do',
          isChecked: false,
        },
        html: {
          placeholder: 'To-do',
          suppressContentEditableWarning: true,
        }
      }
    }
  }

  serialize(app: Carbon, node: Node): SerializedNode {
    const tick = node.attrs.node?.isChecked ? 'x' : ' ';
    const contentNode = node.child(0);
    return {
      name: node.name,
      prefix: `- [${tick}] `,
      title: contentNode?.textContent ?? '',
      content: node.children.slice(1).map(n => app.serialize(n)),

      unwrap: contentNode?.isEmpty ?? false,
      isNested: true
    }

  }
}
