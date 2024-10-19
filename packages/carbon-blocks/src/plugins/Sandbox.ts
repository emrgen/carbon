import { CarbonPlugin } from "@emrgen/carbon-core";
import { NodeSpec } from "@emrgen/carbon-core";

export class Sandbox extends CarbonPlugin {
  name = "sandbox";
  spec(): NodeSpec {
    return {
      group: "block",
      content: "block+",
      sandbox: true,
      props: {},
    };
  }
}
