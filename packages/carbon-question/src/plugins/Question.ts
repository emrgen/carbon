import { PagePlugin } from "@emrgen/carbon-blocks";
import { NodeSpec } from "@emrgen/carbon-core";

export class Question extends PagePlugin {
  name = "question";

  spec(): NodeSpec {
    return {
      group: "content",
      content: "questionTitle (questionDescription){0,1} questionType (questionExplanation){0,1}",
      splits: true,
      splitName: 'section',
      inlineSelectable: true,
      collapsible: true,
      isolate: true,
      document: true,
      attrs: {
        html: {
          contentEditable: true,
          suppressContentEditableWarning: true,
        },
        node: {
          collapsed: false,
        }
      }
    }
  }

}
