import { CarbonPlugin } from "@emrgen/carbon-core";
import { EventHandlerMap } from "@emrgen/carbon-core";

export class MultipleChoiceQuestion extends CarbonPlugin {
  name = "mcq";

  spec() {
    return {
      group: "",
      content: "mcqOption+",
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
          },
        },
      },
    };
  }

  plugins(): CarbonPlugin[] {
    return [new MultipleChoiceOption()];
  }
}

export class MultipleChoiceOption extends CarbonPlugin {
  name = "mcqOption";

  spec() {
    return {
      group: "questionContent",
      content: "title",
      inlineSelectable: true,
      blockSelectable: true,
      splits: true,
      splitName: "mcqOption",
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
          },
        },
      },
    };
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
    };
  }
}
