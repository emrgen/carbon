import {CarbonAction, CarbonPlugin, Node, nodeLocation, NodeSpec, RemoveNodeAction} from "@emrgen/carbon-core";

export class QuestionTitle extends CarbonPlugin {
  name = "questionTitle";

  spec() : NodeSpec {
    return {
      group: "questionContent",
      content: "content+",
      inlineSelectable: true,
      blockSelectable: true,
      // isolate: true,
      consistency: 'remove',
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

  normalize(node: Node): CarbonAction[] {
    console.log('Normalize ', node.name, node.key);
    // check if stack schema is correct
    if (node.isVoid) {
      return [RemoveNodeAction.fromNode(nodeLocation(node)!, node)];
    }

    return [];
  }
}
