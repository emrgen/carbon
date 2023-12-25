import { CarbonPlugin, EventContext, EventHandler, Node, NodeSpec, SerializedNode } from "@emrgen/carbon-core";
import { Section } from "./Section";
import { Switch } from "./Switch";

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
      props: {
        local: {
          placeholder: {
            empty:'To-do',
            focused: 'Press / for commands',
          },
          html: {
            suppressContentEditableWarning: true,
          }
        },
        remote:{
          state: {
            checked: false
          }
        }
      }
    }
  }

  plugins(): CarbonPlugin[] {
    return [
      new Switch(),
    ]
  }

  keydown(): Partial<EventHandler> {
    return {
      // toggle checkbox
      'ctrl_shift_t': (ctx: EventContext<KeyboardEvent>) => {
        const { node, app } = ctx;
        const { selection } = app;
        if (selection.head.node.parent?.eq(node)) {
          app.tr
            .Update(node.id, {
              node: {
                checked: !node.properties.get('node.checked'),
              },
            })
            .Dispatch();
        }
      },
    }
  }

  // serialize(react: Carbon, node: Node): SerializedNode {
  //   const prefix = node.properties.node?.isChecked ? ['x'] : '[]';
  //   return `${prefix} ${react.serialize(node.child(0)!)}` + react.commands.nestable.serializeChildren(node);
  // }
}
