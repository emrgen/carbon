import {CarbonPlugin, NodeSpec, TagPath} from "@emrgen/carbon-core";

declare module '@emrgen/carbon-core' {
  interface Transaction {
  }
}

export class Code extends CarbonPlugin {

  name = 'code';

  spec(): NodeSpec {
    return {
      group: 'content',
      content: 'codeLine+',
      isolating: true,
      blockSelectable: true,
    }
  }
}


