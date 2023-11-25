import { CarbonPlugin, NodeSpec } from "@emrgen/carbon-core";

export class BoardViewItem extends CarbonPlugin {
  name = "boardItem";

  spec(): NodeSpec {
    return {
      group: '',
      content: 'title',
    }
  }
}
