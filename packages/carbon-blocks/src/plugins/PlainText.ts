import {
  CarbonPlugin,
  EventContext,
  EventHandler,
  EventHandlerMap,
  LocalDirtyCounterPath,
  Node,
  NodeEncoder,
  NodePlugin,
  NodeSpec,
  PinnedSelection,
  preventAndStopCtx,
  Writer,
} from "@emrgen/carbon-core";

import { TextPlugin } from "./Text";

// PlainText plugin
export class PlainTextPlugin extends NodePlugin {
  name = "plainText";

  priority: number = 100;

  override spec(): NodeSpec {
    return {
      group: "",
      content: "inline",
      splits: false,
      updates: {
        parent: true,
      },
      props: {
        local: {
          html: {
            suppressContentEditableWarning: true,
          },
        },
      },
    };
  }

  override plugins(): CarbonPlugin[] {
    return [new TextPlugin()];
  }

  override commands(): Record<string, Function> {
    return {};
  }

  override handlers(): EventHandlerMap {
    return {
      // insert text node at
      beforeInput: (ctx: EventContext<KeyboardEvent>) => {
        preventAndStopCtx(ctx);
        const { app, cmd, event } = ctx;
        const { selection } = app.state;
        // @ts-ignore
        const { data, key } = event.nativeEvent;
        const container = selection.head.node.closest((n) => n.isContainer)!;
        cmd
          .Update(container, {
            [LocalDirtyCounterPath]: new Date().getTime(),
          })
          .transform.insertText(selection, data ?? key, false)
          ?.Dispatch();
      },
      input: (ctx: EventContext<KeyboardEvent>) => {
        preventAndStopCtx(ctx);
      },
      dragStart(ctx: EventContext<DragEvent>) {
        ctx.event.preventDefault();
      },
    };
  }

  override keydown(): Partial<EventHandler> {
    return {
      // if the selection is collapsed the cursor is at the end of the line and inline code
      shiftSpace: (ctx: EventContext<KeyboardEvent>) => {},
      shiftEnter: (ctx: EventContext<KeyboardEvent>) => {
        preventAndStopCtx(ctx);
      },
      "ctrl+a": (ctx: EventContext<KeyboardEvent>) => {
        // preventAndStopCtx(ctx);
        // console.log("xxx");
      },
      up: (ctx) => preventAndStopCtx(ctx),
      down: (ctx) => preventAndStopCtx(ctx),
      delete: (ctx: EventContext<KeyboardEvent>) => {
        preventAndStopCtx(ctx);
        const { app, cmd } = ctx;
        const { selection } = app.state;
        const container = selection.head.node.closest((n) => n.isContainer)!;
        const end = selection.end.moveBy(1);
        const deleteSelection = PinnedSelection.create(end!, selection.start);
        cmd
          .Update(container, {
            [LocalDirtyCounterPath]: new Date().getTime(),
          })
          .transform.delete(deleteSelection)
          ?.Dispatch();
      },
      backspace: (ctx: EventContext<KeyboardEvent>) => {
        preventAndStopCtx(ctx);
        const { app, cmd } = ctx;
        const { selection } = app.state;
        if (selection.isCollapsed) {
          if (selection.start.isAtStart) {
            return;
          }
          const container = selection.head.node.closest((n) => n.isContainer)!;
          const start = selection.start.moveBy(-1);
          const deleteSelection = PinnedSelection.create(start!, selection.end);
          cmd
            .Update(container, {
              [LocalDirtyCounterPath]: new Date().getTime(),
            })
            .transform.delete(deleteSelection)
            ?.Dispatch();
        } else {
          const container = selection.head.node.closest((n) => n.isContainer)!;
          cmd
            .Update(container, {
              [LocalDirtyCounterPath]: new Date().getTime(),
            })
            .transform.delete(selection)
            ?.Dispatch();
        }
      },
    };
  }

  onTextInsert(ctx: EventContext<KeyboardEvent>) {
    preventAndStopCtx(ctx);
    const { app, event, cmd } = ctx;
    const { selection } = app;
    // @ts-ignore
    const { data, key } = event.nativeEvent;

    preventAndStopCtx(ctx);
    cmd.transform.insertText(selection, data ?? key, false)?.Dispatch();
  }

  encode(w: Writer, ne: NodeEncoder, node: Node) {
    node.children.map((n) => ne.encode(w, n));
  }

  encodeHtml(w: Writer, ne: NodeEncoder, node: Node) {
    node.children.map((n) => ne.encodeHtml(w, n));
  }
}
