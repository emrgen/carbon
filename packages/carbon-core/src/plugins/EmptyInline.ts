import { InlineAtom } from "./InlineAtom";
import {
  AtomContentPath,
  AtomSizePath,
  EventHandlerMap,
  Node,
  NodeEncoder,
  NodeSpec,
  Pin,
  PinnedSelection,
  preventAndStopCtx,
  Writer,
} from "@emrgen/carbon-core";

// <EmptyInline><IsolateInlineAtom><EmptyInline>

export class EmptyInline extends InlineAtom {
  name = "empty";

  override spec(): NodeSpec {
    return {
      ...super.spec(),
      group: "inline empty",
      zero: true,
      props: {
        [AtomSizePath]: 1,
        [AtomContentPath]: "\u200B",
      },
    };
  }

  keydown(): EventHandlerMap {
    return {
      left: (ctx) => {
        const { currentNode, selection } = ctx;
        console.log(
          "before left",
          selection.head.down().node.id.toString(),
          selection.head.down().offset,
        );
        const down = selection.head.down().leftAlign;

        if (selection.isCollapsed) {
          preventAndStopCtx(ctx);
          console.log(down.node.name, down.node.id.toString());
          const prevFocusable = down.node.prev((n) => {
            console.log("prev", n.name, n.toString());
            return n.isFocusable;
          });
          if (!prevFocusable) {
            console.log("no focusable found");
            return;
          }

          const pin = Pin.toEndOf(prevFocusable)!;
          const after = PinnedSelection.fromPin(pin)!;
          console.log("after", after.toString());
          ctx.cmd.Select(after).Dispatch();
        }
      },
      right: (ctx) => {
        const { currentNode, selection } = ctx;
        const down = selection.start.down().rightAlign;
        if (selection.isCollapsed) {
          preventAndStopCtx(ctx);

          const nextFocusable = down.node.next((n) => n.isFocusable);
          if (!nextFocusable) {
            console.log("no focusable found");
            return;
          }

          const pin = Pin.toStartOf(nextFocusable)!;
          const after = PinnedSelection.fromPin(pin)!;
          ctx.cmd.Select(after).Dispatch();
        }
      },
      shiftRight: (ctx) => {
        preventAndStopCtx(ctx);

        const { selection } = ctx;
        const head = selection.head.down().rightAlign;
        const nextFocusable = head.node.next((n) => n.isFocusable);
        if (!nextFocusable) {
          console.log("no focusable found");
          return;
        }

        const pin = Pin.toStartOf(nextFocusable)!;
        const after = PinnedSelection.create(selection.tail, pin);
        ctx.cmd.Select(after).Dispatch();
      },

      shiftLeft: (ctx) => {
        preventAndStopCtx(ctx);

        const { selection } = ctx;
        const head = selection.head.down().leftAlign;
        const prevFocusable = head.node.prev((n) => n.isFocusable);
        if (!prevFocusable) {
          console.log("no focusable found");
          return;
        }

        const pin = Pin.toStartOf(prevFocusable)!;
        const after = PinnedSelection.create(selection.tail, pin);
        ctx.cmd.Select(after).Dispatch();
      },
    };
  }

  encode(w: Writer, ne: NodeEncoder, node: Node) {
    w.write("");
  }

  encodeHtml(w: Writer, ne: NodeEncoder, node: Node) {
    w.write("");
  }

  static is(node: Node): boolean {
    return node.name === "empty";
  }

  static isPrefix(node: Node): boolean {
    const { prevSibling, nextSibling } = node;
    return <boolean>(
      (node.name === "empty" &&
        !prevSibling &&
        nextSibling?.isIsolate &&
        nextSibling?.isInlineAtom &&
        !nextSibling?.isFocusable)
    );
  }

  static isSuffix(node: Node): boolean {
    const { prevSibling, nextSibling } = node;
    return <boolean>(
      (node.name === "empty" &&
        !node.nextSibling &&
        prevSibling?.isIsolate &&
        prevSibling?.isInlineAtom &&
        !prevSibling?.isFocusable)
    );
  }

  static isBetween(node: Node): boolean {
    const { prevSibling, nextSibling } = node;
    return <boolean>(
      (node.name === "empty" &&
        prevSibling?.isIsolate &&
        prevSibling?.isInlineAtom &&
        !prevSibling?.isFocusable &&
        nextSibling?.isIsolate &&
        nextSibling?.isInlineAtom &&
        !nextSibling?.isFocusable)
    );
  }
}
