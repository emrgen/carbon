import { CarbonPlugin, NodeSpec } from "@emrgen/carbon-core";
import { Section } from "./Section";

export class NumberedList extends Section {
  name = 'numberedList'

  spec(): NodeSpec {
    return {
      ...super.spec(),
      splitName: 'numberedList',
      info: {
        title: 'Numbered List',
        description: 'Create a numbered list',
        icon: 'numberedList',
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
