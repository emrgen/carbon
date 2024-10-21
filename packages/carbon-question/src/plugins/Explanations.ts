// import { Collapsible } from "./Collapsible";
import { NodeSpec } from "@emrgen/carbon-core";
import { CarbonPlugin } from "@emrgen/carbon-core";

export const ViewedPath = "local/state/viewed";

export class Explanations extends CarbonPlugin {
  name = "explanations";

  spec(): NodeSpec {
    return {
      group: "",
      isolate: true,
      content: "title explanation*",
      props: {
        local: {
          html: {
            contentEditable: false,
            suppressContentEditableWarning: true,
          },
        },
      },
    };
  }

  plugins(): CarbonPlugin[] {
    return [new Explanation()];
  }
}

export class Explanation extends CarbonPlugin {
  name = "explanation";

  spec(): NodeSpec {
    return {
      group: "",
      content: "title content*",
    };
  }
}
