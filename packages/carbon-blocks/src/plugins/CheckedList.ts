import { CarbonPlugin, Node, NodeSpec } from "@emrgen/carbon-core";
import { Section } from "./Section";

export class CheckedList extends Section {
  name = 'checkedList'

  spec(): NodeSpec {
    return {
      ...super.spec(),
      splitName: 'checkedList',
      info: {
        title: 'Task'
      },
      attrs: {
        node: {
          emptyPlaceholder: 'Task',
          isChecked: false,
        },
        html: {
          placeholder: 'Task',
          suppressContentEditableWarning: true,
        }
      }
    }
  }

  serialize(node: Node): string {
    const tick = node.attrs.node.isChecked ? 'x' : ' ';
    return `- [${tick}] ` + node.textContent || '';
  }
}
