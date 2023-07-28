import { CarbonPlugin, EventContext, EventHandler, NodeSpec } from "@emrgen/carbon-core";

export class QuestionAnswer extends CarbonPlugin {

  name = "questionAnswer";

  spec(): NodeSpec {
    return {
      group: "",
      content: "title content*",
      splits: true,
      splitName: "section",
      selectable: true,
      isolating: true,
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
        const { app, selection, node } = ctx;
        console.log('[Enter] collapsible');
        if (selection.inSameNode && selection.start.node.parent?.eq(node) && !node.isEmpty) {
          ctx.event.preventDefault();
          ctx.stopPropagation();
          app.cmd.collapsible.split(selection)?.dispatch();
        }
      }
    }
  }
}
