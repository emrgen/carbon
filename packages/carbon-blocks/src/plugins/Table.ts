import { CarbonPlugin, EventContext, EventHandler, preventAndStopCtx } from "@emrgen/carbon-core";

export class Table extends CarbonPlugin {
  name = "table";

  spec() {
    return {
      group: 'content',
      content: "row+",
      isolating: true,
      draggable: true,
      dragHandle: true,
      rectSelectable: true,
      blockSelectable: true,
      attrs: {
        node: {

        },
        html: {
          contentEditable: false,
          suppressContentEditableWarning: true,
        }
      }
    };
  }

  plugins(): CarbonPlugin[] {
    return [
      new Row(),
      new Column(),
    ]
  }

}

export class Row extends CarbonPlugin {
  name = "row";

  spec() {
    return {
      group: 'content',
      content: "column+",
      draggable: true,
      dragHandle: true,
      rectSelectable: true,

      attrs: {
        node: {
          tag: 'tr',
        },
        html: {
          // contentEditable: true,
          // suppressContentEditableWarning: true,
        }
      }
    };
  }

}

export class Column extends CarbonPlugin {
  name = "column";

  spec() {
    return {
      group: 'content',
      content: "title",
      // isolating: true,
      draggable: true,
      dragHandle: true,
      rectSelectable: true,
      attrs: {
        node: {
          tag: 'td',
        },
        html: {
          contentEditable: true,
          suppressContentEditableWarning: true,
          style: {
            width: '200px'
          },
        }
      }
    };
  }

  keydown(): Partial<EventHandler> {
    return {
      enter: (ctx: EventContext<KeyboardEvent>) => {
        preventAndStopCtx(ctx);
      },
      shiftLeft: (ctx: EventContext<KeyboardEvent>) => {
        const { currentNode, app } = ctx;
        const { selection } = app.state;
        if (!selection.isCollapsed && selection.start.isAtStartOfNode(currentNode)) {
          preventAndStopCtx(ctx);

        }
      },
      shiftRight: (ctx: EventContext<KeyboardEvent>) => {
        const { currentNode, app } = ctx;
        const { selection } = app;
        if (!selection.isCollapsed && selection.end.isAtEndOfNode(currentNode)) {
          preventAndStopCtx(ctx);
        }
      },
      backspace: (ctx: EventContext<KeyboardEvent>) => {
        const { currentNode, app } = ctx;
        const { selection } = app;
        if (selection.isCollapsed && selection.start.isAtStartOfNode(currentNode)) {
          preventAndStopCtx(ctx);
        }
      },
      delete: (ctx: EventContext<KeyboardEvent>) => {
        const { currentNode, app } = ctx;
        const { selection } = app;
        if (selection.isCollapsed && selection.end.isAtEndOfNode(currentNode)) {
          preventAndStopCtx(ctx);
        }
      }
    }
  }

}
