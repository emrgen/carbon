import { CarbonPlugin, EventHandler, NodeSpec } from "@emrgen/carbon-core";
import { Collapsible } from "./Collapsible";

export class Frame extends Collapsible  {

  name = 'frame';

  spec(): NodeSpec {
    return {
      ...super.spec(),
      group: 'content',
      splits: false,
      isolate: true,
      draggable: true,
      dragHandle: true,
      props: {
        local: {
          html: {
            contentEditable: true,
            suppressContentEditableWarning: true,
          },
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
