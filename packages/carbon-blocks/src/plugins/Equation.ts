import { CarbonPlugin, NodeSpec } from "@emrgen/carbon-core";

export class Equation extends CarbonPlugin {
  name = "equation";

  spec(): NodeSpec {
    return {
      content: 'title',
      sandbox: true,
      isolating: true,
      selectable: true,
      draggable: true,
      dragHandle: true,
      rectSelectable: true,
      attrs: {
        html: {
          contentEditable: false,
          suppressContentEditableWarning: true,
          'data-content-editable': false,
        }
      }
    }
  }
}
