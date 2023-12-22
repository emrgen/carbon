import { CarbonPlugin, EventContext, EventHandler, NodeSpec, preventAndStopCtx } from "@emrgen/carbon-core";

export class Equation extends CarbonPlugin {
  name = "equation";

  spec(): NodeSpec {
    return {
      group: 'content',
      content: 'title',
      atom: true,
      isolating: true,
      inlineSelectable: true,
      draggable: true,
      dragHandle: true,
      rectSelectable: true,
      blockSelectable: true,
      insert: true,
      info: {
        title: 'Equation',
        description: 'Scientific equation ',
        icon: 'equation',
        tags: ['equation', 'math', 'latex', 'formula', 'mathjax', 'katex', 'mathml', 'mathematics', 'maths', 'mathematical']
      },
      attrs: {
        html: {
          contentEditable: false,
          suppressContentEditableWarning: true,
          'data-content-editable': false,
        }
      }
    }
  }

  keydown(): Partial<EventHandler> {
    return {
      enter: (ctx: EventContext<KeyboardEvent>) => {
        const { app, node } = ctx;
        preventAndStopCtx(ctx);
        app.tr
          .Update(node, { node: { isEditing: !node.properties.node.isEditing } })
          .Dispatch();
      }
    }
  }
}
