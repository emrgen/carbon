import {CarbonPlugin, NodeSpec} from "@emrgen/carbon-core";

export class Media extends CarbonPlugin {
  name = 'media'

  spec(): NodeSpec {
    return {
      group: "content",
      atom: true,
      isolate: true,
      dnd: {
        handle: true,
        draggable: true,
      },
      selection: {
        block: true,
        rect: true,
      },
    }
  }
}