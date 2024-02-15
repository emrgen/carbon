import {CarbonPlugin} from "@emrgen/carbon-core";
import {Collapsible} from "./Collapsible";

export class Explain extends Collapsible {
  name = 'explain';

  spec() {
    return {
      ...super.spec(),
      info: {
        title: 'Explain',
        description: 'Insert an explanation',
        icon: 'content',
        tags: ['explain', 'explanation', 'block content']
      },
      props: {
        local:{
          html: {
            // contentEditable: false,
            // suppressContentEditableWarning: true,
          }
        }
      }
    }
  }
}
