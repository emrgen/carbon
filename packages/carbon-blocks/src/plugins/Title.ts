import {
  CarbonAction,
  CarbonPlugin,
  deepCloneMap,
  EventContext,
  EventHandler,
  EventHandlerMap,
  MarksPath,
  Node,
  NodePlugin,
  NodeSpec,
  Point,
  PointedSelection,
  preventAndStopCtx,
  SetContentAction,
} from "@emrgen/carbon-core";

import { TextPlugin } from "./Text";
import { flatten, identity } from "lodash";
import { NodeEncoder, Writer } from "@emrgen/carbon-core/src/core/Encoder";
import { TextBlock } from "@emrgen/carbon-core/src/core/TextBlock";
import { InlineNode } from "@emrgen/carbon-core/src/core/InlineNode";

// title is a block content that can be used as a title for a block
export class TitlePlugin extends NodePlugin {
  name = "title";

  priority: number = -1;

  override spec(): NodeSpec {
    return {
      group: "",
      content: "inline*",
      focusable: true,
      attrs: {
        html: {
          suppressContentEditableWarning: true,
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
        console.log("input", ctx.event);
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
      shiftSpace: (ctx: EventContext<KeyboardEvent>) => {
        const { app, currentNode } = ctx;
        const { selection } = app.state;
        if (!selection.isCollapsed) {
          return;
        }
        const { head } = selection;
        const down = head.down();
        const marks = down.node.props.get(MarksPath, []);
        console.log(down.isAtEnd, down.node.textContent, marks);
        if (down.isAtEnd && down.node.isInline) {
          preventAndStopCtx(ctx);
          const textNode = app.schema.text(" ")!;
          const content = flatten([
            down.node.prevSiblings,
            down.node,
            textNode,
            down.node.nextSiblings,
          ]).filter(identity) as Node[];
          console.log(down.node.textContent, content);
          app.cmd
            .SetContent(
              currentNode,
              content.map((n) => n.clone(deepCloneMap)),
            )
            .Select(
              PointedSelection.fromPoint(
                Point.atOffset(head.node.id, head.offset + 1),
              ),
            )
            .Dispatch();
        }
      },
      shiftEnter: (ctx: EventContext<KeyboardEvent>) => {
        const { app } = ctx;
        const { selection, blockSelection } = app.state;
        if (blockSelection.isActive) return;

        if (selection.isCollapsed) {
          preventAndStopCtx(ctx);
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

  override normalize(node: Node): CarbonAction[] {
    const content = TextBlock.from(node).normalizeContent();
    const { children } = node;
    if (
      content.length === children.length &&
      content.every((n, i) => InlineNode.isSimilar(n, children[i]))
    ) {
      return [];
    }

    console.log(
      "NORMALIZE",
      content.map((n) => [n.textContent, n.marks.map((m) => m.toJSON())]),
      children.map((n) => [n.textContent, n.marks.map((m) => m.toJSON())]),
    );

    return [SetContentAction.withBefore(node, children, content)];
  }

  encode(w: Writer, ne: NodeEncoder, node: Node) {
    node.children.map((n) => ne.encode(w, n));
  }

  encodeHtml(w: Writer, ne: NodeEncoder, node: Node) {
    node.children.map((n) => ne.encodeHtml(w, n));
  }
}
