import { CarbonPlugin, NodeSpec } from "@emrgen/carbon-core";

export class BoardViewColumn extends CarbonPlugin {
  name = "boardColumn";

  spec(): NodeSpec {
    return {
      group: '',
      content: 'title boardItem*',
    }
  }
}
