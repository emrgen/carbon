import {CarbonPlugin, EventContext, EventHandlerMap} from "@emrgen/carbon-core";

export class MultipleChoiceOption extends CarbonPlugin {
  name = "multipleChoiceOption";

  spec() {
    return {
      group: "questionContent",
      content: "title",
      inlineSelectable: true,
      blockSelectable: true,
      splits: true,
      splitName: "multipleChoiceOption",
      depends: {
        prev: true,
        next: true,
      },
      props: {
        local: {
          html: {
            contentEditable: true,
            suppressContentEditableWarning: true,
          },
          placeholder: {
            empty: "",
            focused: "",
          }
        },
      }
    }
  }

  keydown(): EventHandlerMap {
    return {
      // enter: (ctx: EventContext<KeyboardEvent>) => {
      //   const {currentNode, app} = ctx;
      //   const {state} = app;
      //   const {selection} = state;
      //   if (!selection.isCollapsed) return
      //
      //   const isAtStart = selection.start.isAtStartOfNode(currentNode);
      //   if (isAtStart && currentNode.isEmpty && !currentNode.nextSibling?.type.eq(currentNode.type)) {
      //     app.cmd.change(currentNode, 'section').Dispatch();
      //     return true;
      //   }
      // }
    }
  }
}
