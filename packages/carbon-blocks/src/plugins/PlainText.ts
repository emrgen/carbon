import {
  CarbonPlugin,
  EventContext,
  EventHandler,
  EventHandlerMap,
  Node,
  NodeEncoder,
  NodePlugin,
  NodeSpec,
  preventAndStopCtx,
  Writer,
} from "@emrgen/carbon-core";

import { TextPlugin } from "./Text";

// title is a block content that can be used as a title for a block
export class PlainTextPlugin extends NodePlugin {
  name = "plainText";

  priority: number = 100;

  override spec(): NodeSpec {
    return {
      group: "",
      content: "inline*",
      splits: false,
      props: {
        local: {
          html: {},
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
        cmd.transform.insertText(selection, data ?? key, false)?.Dispatch();
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
