import {CarbonPlugin, NodeSpec} from "@emrgen/carbon-core";

export class QuestionDescription extends CarbonPlugin {
  name = "questionDescription";

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
            contentEditable: false,
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
