import { BeforePlugin, CarbonPlugin, EventContext, EventHandler, EventHandlerMap, NodeSpec } from "@emrgen/carbon-core";

export class Code extends CarbonPlugin {
  name = 'code';

  spec(): NodeSpec {
    return {
      group: 'content',
      content: 'title',
      splitName: 'section',
      selectable: true,
      isolating: true,
      draggable: true,
      dragHandle: true,
      rectSelectable: true,
      info: {
        title: 'Code',
      },
      attrs: {
        node: {
          focusPlaceholder: 'Code',
          emptyPlaceholder: '',
          tag: 'code',
        },
        html: {
          suppressContentEditableWarning: true,
        }
      }
    }
  }

  plugins(): CarbonPlugin[] {
    return [
      new BeforeCodePlugin(),
    ]
  }

  keydown(): Partial<EventHandler> {
    return {
      enter: (ctx: EventContext<KeyboardEvent>) => {
        ctx.event.preventDefault();
        ctx.stopPropagation();
        const { app, node } = ctx;
        const { selection } = app;

        app.cmd.transform.insertText(selection, '\r\n')?.dispatch();
      },

      tab: (ctx: EventContext<KeyboardEvent>) => {
        ctx.event.preventDefault();
        ctx.stopPropagation();
        const { app, node } = ctx;
        const { selection } = app;

        app.cmd.transform.insertText(selection, '  ')?.dispatch();
      },

      backspace: (ctx: EventContext<KeyboardEvent>) => {
        const { app, event, node } = ctx;
        const { selection, cmd } = app;
        const { start } = selection;
        console.log('xxxxx');
        
        if (selection.isCollapsed && start.isAtStart) {
          ctx.event.preventDefault();
          ctx.stopPropagation();
          app.tr
            .change(node.id, 'code', 'section')
            .select(selection)
            .dispatch();
        }
      }
    }
  }

}

export class BeforeCodePlugin extends BeforePlugin {
  name = 'beforeCode';

  // priority = 10002;

  on(): EventHandlerMap {
    return {
      // insert text node at
      // beforeInput: (ctx: EventContext<KeyboardEvent>) => {
      //   const { app, event, node } = ctx;
      //   console.log('xxxXXX');
        
      //   if (node.name === 'code') {
      //     ctx.event.preventDefault();
      //     ctx.stopPropagation();

      //     const { firstChild: textBlock } = node;
      //     if (!textBlock) {
      //       console.error(`textBlock not found for block ${node.id.toString()}`);
      //       return;
      //     }

      //     const { selection } = app;

      //     console.log('textBlock', textBlock);
      //   }
      // },
    }
  }
}
