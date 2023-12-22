import { NodeSpec } from "@emrgen/carbon-core";
import { CarbonPlugin } from "@emrgen/carbon-core";

export class DocLink extends CarbonPlugin {
  name = 'docLink'

  spec(): NodeSpec {
    return {
      group: 'content',
      content: 'title',
      splitName: 'section',
      inlineSelectable: true,
      isolating: true,
      draggable: true,
      dragHandle: true,
      rectSelectable: true,
      info: {
        title: 'Code',
      },
      attrs: {
        node: {
          focusPlaceholder: 'Code',
          emptyPlaceholder: '',
          // tag: 'code',
        },
        html: {
          contentEditable: false,
          suppressContentEditableWarning: true,
        }
      }
    }
  }
}
