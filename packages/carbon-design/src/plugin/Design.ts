import { CarbonPlugin, NodeSpec } from "@emrgen/carbon-core";
import { Element } from "./Element";
import { Transformer } from "./Transformer";

export class Design extends CarbonPlugin {
  name = "deBoard";
  spec(): NodeSpec {
    return {
      group: "content",
      content: "deContent",
      isolate: true,
      dnd: {
        container: true,
        region: true,
      },
    };
  }

  plugins(): CarbonPlugin[] {
    return [new Element(), new Transformer()];
  }
}
