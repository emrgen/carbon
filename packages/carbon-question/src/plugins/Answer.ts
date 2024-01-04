import { CarbonPlugin, EventContext, EventHandler, NodeSpec, preventAndStopCtx } from "@emrgen/carbon-core";

export class QuestionAnswer extends CarbonPlugin {

  name = "questionAnswer";

  spec(): NodeSpec {
    return {
      group: "",
      content: "title content*",
      splits: true,
      splitName: "section",
      inlineSelectable: true,
      isolate: true,
      sandbox: true,
      collapsible: true,
      attrs: {
        html: {
        },
        node: {
          collapsed: false,
          emptyPlaceholder: 'Type your question here',
        }
      }
    }
  }

  keydown(): Partial<EventHandler> {
    return {
      enter(ctx: EventContext<KeyboardEvent>) {
        const { app, selection, currentNode, cmd } = ctx;
        console.log('[Enter] collapsible');
        if (selection.inSameNode && selection.start.node.parent?.eq(currentNode) && !currentNode.isEmpty) {
          preventAndStopCtx(ctx)
          cmd.collapsible.split(selection)?.Dispatch();
        }
      }
    }
  }
}
