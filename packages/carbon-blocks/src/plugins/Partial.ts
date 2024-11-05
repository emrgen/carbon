import { NodeSpec } from "@emrgen/carbon-core";
import { Collapsible } from "./Collapsible";

export class Partial extends Collapsible {
  name = "partial";

  override spec(): NodeSpec {
    return {
      ...super.spec(),
      content: "title (paragraph|bulletList|numberList)*",
    };
  }
}
