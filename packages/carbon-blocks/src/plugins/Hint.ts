import {Collapsible} from "./Collapsible";
import {NodeSpec} from "@emrgen/carbon-core";

export class Hint extends Collapsible {
    name = 'hint';

    spec(): NodeSpec {
      return {
        ...super.spec(),
        props: {
          ...super.spec().props,
          local: {
            html: {
              // contentEditable: false,
            }
          }
        }
      }
    }
}
