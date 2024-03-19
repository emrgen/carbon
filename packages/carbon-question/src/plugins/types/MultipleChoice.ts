import {CarbonPlugin} from "@emrgen/carbon-core";
import {MultipleChoiceOption} from "./MultipleChoiceOption";

export class MultipleChoice extends CarbonPlugin {
  name = "multipleChoice";

  spec() {
    return {
      group: "questionTypeContent",
      content: "multipleChoiceOption+",
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


  plugins(): CarbonPlugin[] {
    return [
      new MultipleChoiceOption()
    ]
  }
}
