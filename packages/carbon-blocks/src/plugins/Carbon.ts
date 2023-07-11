import { CarbonPlugin, NodeSpec } from "@emrgen/carbon-core";

export class Carbon extends CarbonPlugin {

  name = 'carbon';

  spec(): NodeSpec {
    return {
      // group: '',
      // content: 'carbon',
      // focusable: true,
      attrs: {
        html: {
          suppressContentEditableWarning: true,
        }
      }
    }
  }
}
