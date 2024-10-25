import { CarbonPlugin, NodeSpec } from "@emrgen/carbon-core";

export class Sandbox extends CarbonPlugin {
  name = "sandbox";
  spec(): NodeSpec {
    return {
      group: "block content",
      content: "block+",
      sandbox: true,
      props: {},
    };
  }
}
