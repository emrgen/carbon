import { NodeSpec } from "@emrgen/carbon-core";
import { EventHandlerMap } from "@emrgen/carbon-core";
import { EventContext } from "@emrgen/carbon-core";
import { preventAndStopCtx } from "@emrgen/carbon-core";
import { CarbonPlugin } from "@emrgen/carbon-core";
import { Hints } from "./Hints";
import { Explanations } from "./Explanations";
import { MultipleChoiceQuestion } from "./MultipleChoiceQuestion";

export class Question extends CarbonPlugin {
  name = "question";

  spec(): NodeSpec {
    return {
      group: "content",
      content: "title content* hints* explanations*",
      // splits: true,
      splitName: "section",
      inlineSelectable: true,
      collapsible: true,
      isolate: true,
      document: true,
      observable: true,
      attrs: {
        html: {
          contentEditable: true,
          suppressContentEditableWarning: true,
        },
        node: {
          collapsed: false,
        },
      },
    };
  }

  plugins(): CarbonPlugin[] {
    return [new Hints(), new Explanations(), new MultipleChoiceQuestion()];
  }

  keydown(): EventHandlerMap {
    return {
      enter(ctx: EventContext<KeyboardEvent>) {
        const { app, selection, currentNode } = ctx;
        console.log("[Enter] Question");
        // if selection is within the collapsible node title split the collapsible node
        if (
          selection.inSameNode &&
          selection.start.node.parent?.eq(currentNode) &&
          !currentNode.isEmpty
        ) {
          preventAndStopCtx(ctx);
          app.cmd.collapsible.split(selection)?.Dispatch();
        }
      },
    };
  }
}
