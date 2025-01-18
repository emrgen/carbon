import {
  CarbonAction,
  CarbonPlugin,
  deepCloneMap,
  EventContext,
  EventHandler,
  EventHandlerMap,
  InlineNode,
  MarksPath,
  Node,
  NodeEncoder,
  NodePlugin,
  NodeSpec,
  Point,
  PointedSelection,
  preventAndStopCtx,
  SetContentAction,
  TitleNode,
  withinCodeBlock,
  Writer,
} from "@emrgen/carbon-core";

import { TextPlugin } from "./Text";

// title is a block content that can be used as a title for a block
export class TitlePlugin extends NodePlugin {
  name = "title";

  priority: number = -1;

  override spec(): NodeSpec {
    return {
      group: "title",
      content: "inline*",
      tag: "p",
      attrs: {
        html: {
          suppressContentEditableWarning: true,
          className: "ti",
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
        const { steps } = head;
        const down = head.down();
        const marks = down.node.props.get(MarksPath, []);
        console.log(down.isAtEnd, down.node.textContent, marks);
        if (down.isAtEnd && down.node.isInline) {
          preventAndStopCtx(ctx);
          const startStepFromEnd = head.steps - head.node.stepSize;
          const textNode = app.schema.text(" ")!;
          const titleNode = TitleNode.from(head.node.clone(deepCloneMap))
            .insertInp(head.steps, textNode)
            .normalize();
          const steps =
            titleNode.stepSize + titleNode.mapStep(startStepFromEnd);

          app.cmd
            .SetContent(head.node, titleNode.children)
            .Select(
              PointedSelection.fromPoint(
                Point.atOffset(head.node.id, head.offset + 1, steps),
              ),
            )
            .Dispatch();
        }
      },
      shiftEnter: (ctx: EventContext<KeyboardEvent>) => {
        const { app } = ctx;
        const { selection, blockSelection } = app.state;
        if (blockSelection.isActive) return;

        if (withinCodeBlock(ctx.currentNode)) {
          const splitBlock = selection.start.node.closest((n) => n.type.splits);
          if (splitBlock) {
            preventAndStopCtx(ctx);
            app.cmd.transform.split(splitBlock, selection).Dispatch();
            return;
          }
        }

        if (selection.isCollapsed) {
          preventAndStopCtx(ctx);
          this.insertText(ctx, "\n");
        }
      },
      enter: (ctx: EventContext<KeyboardEvent>) => {
        if (ctx.currentNode.parent?.type.isCode) {
          this.insertText(ctx, "\n");
        }
      },
      tab: (ctx: EventContext<KeyboardEvent>) => {
        if (ctx.currentNode.parent?.type.isCode) {
          // TODO: insert extra tab to match indentation
          const { selection } = ctx;
          const { start, end } = selection;
          const { textContent } = ctx.currentNode;
          // const { offset };
          if (selection.isCollapsed) {
            this.insertText(ctx, `\t`);
          } else {
            console.error("not implemented");
          }
        }
      },
    };
  }

  protected insertText(ctx: EventContext<KeyboardEvent>, text: string) {
    preventAndStopCtx(ctx);
    const { app, cmd } = ctx;
    cmd.transform.insertText(app.state.selection, text, false)?.Dispatch();
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
    return [];
    // console.log(
    //   node.children.map((n) => [n.textContent, n.marks.map((m) => m.toJSON())]),
    // );
    const content = TitleNode.from(node).normalizeContent();
    const { children } = node;
    if (
      content.length === children.length &&
      content.every((n, i) => InlineNode.isSimilar(n, children[i]))
    ) {
      return [];
    }

    // console.log(
    //   "NORMALIZE",
    //   content.map((n) => [n.textContent, n.marks.map((m) => m.toJSON())]),
    //   children.map((n) => [n.textContent, n.marks.map((m) => m.toJSON())]),
    // );

    return [SetContentAction.withBefore(node, children, content)];
  }

  encode(w: Writer, ne: NodeEncoder, node: Node) {
    node.children.map((n) => ne.encode(w, n));
  }

  encodeHtml(w: Writer, ne: NodeEncoder, node: Node) {
    node.children.map((n) => ne.encodeHtml(w, n));
  }
}
