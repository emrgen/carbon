import {Collapsible} from "./Collapsible";
import {NodeSpec} from "@emrgen/carbon-core";
import {Header, Heading} from "./Header";

export class Question extends Heading {
    name = 'question';

    constructor() {
      super(3);
    }

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
