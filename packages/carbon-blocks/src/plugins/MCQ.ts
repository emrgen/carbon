import {Collapsible} from "./Collapsible";
import {NodeSpec} from "@emrgen/carbon-core";
import {Todo} from "./Todo";

export class MCQ extends Todo {
    name = 'mcq';

    spec(): NodeSpec {
      return {
        ...super.spec(),
        splitName: 'mcq',
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
