import {Collapsible} from "./Collapsible";
import {NodeSpec} from "@emrgen/carbon-core";

export const ViewedPath = 'local/state/viewed';

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
            },
            state: {
              viewed: false,
              collapsed: true,
            }
          }
        }
      }
    }
}
