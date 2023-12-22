import { DocPlugin } from "@emrgen/carbon-blocks";
import { NodeSpec } from "@emrgen/carbon-core";

export class Question extends DocPlugin {
  name = "question";

  spec(): NodeSpec {
    return {
      group: "",
      content: "title content* questionAnswer+",
      splits: true,
      splitName: 'section',
      inlineSelectable: true,
      collapsible: true,
      isolate: true,
      sandbox: true,
      document: true,
      attrs: {
        html: {
          'data-as': "document",
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
