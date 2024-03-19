import {CarbonPlugin, NodeSpec} from "@emrgen/carbon-core";
import {MultipleChoice} from "./types/MultipleChoice";

export class QuestionType extends CarbonPlugin {
  name = "questionType";

  spec() : NodeSpec {
    return {
      group: "questionContent",
      content: "multipleChoice",// | trueFalse | shortAnswer | fillInTheBlank | matching | ordering | essay | fileUpload | numericResponse | formula | ranking | multipleAnswer | categorization | hotspot | table | graph | drawing | audio | video | image | code | math)",
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
            empty: "QuestionType",
            focused: "QuestionType",
          }
        },
      }
    }
  }

  plugins(): CarbonPlugin[] {
    return [
      new MultipleChoice(),
    ]
  }
}
