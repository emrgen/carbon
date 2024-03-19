import {CarbonPlugin, NodeSpec} from "@emrgen/carbon-core";

export class QuestionExplanation extends CarbonPlugin {
  name = "questionExplanation";

  spec() : NodeSpec {
    return {
      group: "questionContent",
      content: "content+",
      inlineSelectable: true,
      blockSelectable: true,
      isolate: true,
      props: {
        local: {
          html: {
            contentEditable: true,
            suppressContentEditableWarning: true,
          },
          placeholder: {
            empty: "Question Title",
            focused: "Question Title",
          }
        },
      }
    }
  }
}
