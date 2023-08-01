import { Carbon, CarbonPlugin, EventContext, EventHandler, Node, NodeSpec, SerializedNode } from "@emrgen/carbon-core";
import { Section } from "./Section";

export class Todo extends Section {
  name = 'todo'

  spec(): NodeSpec {
    return {
      ...super.spec(),
      splitName: 'todo',
      info: {
        title: 'To-do List',
        description: 'Create a to-do list',
        icon: 'todo',
      },
      attrs: {
        node: {
          emptyPlaceholder: 'To-do',
          isChecked: false,
        },
        html: {
          // placeholder: 'To-do',
          suppressContentEditableWarning: true,
        }
      }
    }
  }

  keydown(): Partial<EventHandler> {
    return {
      // toggle checkbox
      'ctrl_shift_t': (ctx: EventContext<KeyboardEvent>) => {
        const { node, app } = ctx;
        const { selection } = app;
        if (selection.head.node.parent?.eq(node)) {
          app.tr
            .updateAttrs(node.id, {
              node: {
                isChecked: !node.attrs.node.isChecked,
              },
            })
            .dispatch();
        }
      },
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
