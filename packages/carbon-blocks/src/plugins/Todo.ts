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
        tags: ['to-do list', 'todo', 'checkbox', 'checklist'],
        order: 5,
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
    const prefix = node.attrs.node?.isChecked ? ['x'] : '[]';
    return `${prefix} ${app.serialize(node.child(0)!)}` + app.cmd.nestable.serializeChildren(node);
  }
}
