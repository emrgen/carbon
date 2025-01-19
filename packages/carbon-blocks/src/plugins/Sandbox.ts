import { CarbonPlugin, NodeSpec } from "@emrgen/carbon-core";

// Sandbox is a block content plugin that allows for the creation of a sandbox
// Child update does not inform parents of changes
// This is absolutely necessary for the cell, video, image, embed to work as they are all children of the sandbox
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
