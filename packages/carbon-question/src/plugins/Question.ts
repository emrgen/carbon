import { Carbon, NodeSpec } from "@emrgen/carbon-core";
import { EventHandlerMap } from "@emrgen/carbon-core";
import { EventContext } from "@emrgen/carbon-core";
import { preventAndStopCtx } from "@emrgen/carbon-core";
import { CarbonPlugin, Node } from "@emrgen/carbon-core";
import { Hints } from "./Hints";
import { Explanations } from "./Explanations";
import { MCQ } from "./MCQ";

declare module "@emrgen/carbon-core" {
  export interface Service {
    question: {
      isAttempted(node: Node): boolean;
      summary(node: Node): {};
    };
  }
}

interface QuestionSummary {
  correct: boolean;
  partialCorrect: boolean;
}

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

  services(): Record<string, Function> {
    return {
      isAttempted(app: Carbon, node: Node) {
        // find the possible question types and check if they are attempted
        const found = node.children.find((n) =>
          n.groups.includes("questionType"),
        );

        if (found) {
          return app.service[found.name].isAttempted(found);
        }
        return false;
      },
      summary(app: Carbon, node: Node) {
        const found = node.children.find((n) =>
          n.groups.includes("questionType"),
        );

        if (found) {
          return app.service[found.name].summary(found);
        }

        return { correct: false, partialCorrect: false };
      },
    };
  }

  plugins(): CarbonPlugin[] {
    return [new Hints(), new Explanations(), new MCQ()];
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
