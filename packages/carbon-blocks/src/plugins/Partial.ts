import { NodeSpec } from "@emrgen/carbon-core";
import { Section } from "@emrgen/carbon-blocks";

export class Partial extends Section {
  name = "partial";

  override spec(): NodeSpec {
    return {
      ...super.spec(),
      content: "title (section|bulletList|numberList)*",
    };
  }
}
