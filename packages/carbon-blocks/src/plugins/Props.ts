import {CarbonPlugin, NodeSpec, SandboxedProps} from "@emrgen/carbon-core";

// Sandbox is a block content plugin that allows for the creation of a sandbox
// Child update does not inform parents of changes
// This is absolutely necessary for the cell, video, image, embed to work as they are all children of the sandbox
export class Props extends CarbonPlugin {
  name = SandboxedProps;
  spec(): NodeSpec {
    return {
      group: "linked",
      content: "",
      selection: {
        rect: true,
      },
      props: {},
    };
  }
}
