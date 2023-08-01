import { CarbonPlugin, NodeSpec } from "@emrgen/carbon-core";
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
        tags: ['bulleted list', 'unordered list', 'list', 'ul', 'unordered']
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
}
