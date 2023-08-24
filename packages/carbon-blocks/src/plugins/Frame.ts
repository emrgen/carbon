import { CarbonPlugin, EventHandler, NodeSpec } from "@emrgen/carbon-core";
import { Collapsible } from "./Collapsible";

export class Frame extends Collapsible  {

  name = 'frame';

  spec(): NodeSpec {
    return {
      ...super.spec(),
      attrs: {
        ...super.spec().attrs,
        node: {
          ...super.spec().attrs?.node,
          focusPlaceholder: 'Frame',
          emptyPlaceholder: 'Frame',
        }
      },
      info: {
        title: 'Frame',
        description: 'A frame is a container for other blocks',
        icon: 'frame',
        tags: ['frame', 'container', 'div', 'box']
      },
    }
  }

}
