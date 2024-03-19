import {CarbonPlugin, NodeSpec} from "@emrgen/carbon-core";

export class QuestionHints extends CarbonPlugin {
  name = "questionHints";

  spec(): NodeSpec {
    return {
      group: "questionContent",
      content: "hint+",

    }
  }
}
