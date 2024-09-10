import { InlineAtom } from "./InlineAtom";
import {
  AtomContentPath,
  AtomSizePath,
  EventHandlerMap,
  Node,
  NodeSpec,
  Pin,
  PinnedSelection,
  preventAndStopCtx,
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
      right: (ctx) => {
        const { currentNode } = ctx;
        const selection = EmptyInline.normalizeSelection(ctx.selection);
        const { start } = selection;
        const down = start.down().rightAlign;
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
      left: (ctx) => {
        const { currentNode } = ctx;
        const selection = EmptyInline.normalizeSelection(ctx.selection);
        const { start } = selection;
        const down = start.down().leftAlign;

        if (selection.isCollapsed) {
          preventAndStopCtx(ctx);
          const prevFocusable = down.node.prev((n) => {
            console.log("prev", n.name, n);
            return n.isFocusable;
          });
          if (!prevFocusable) {
            console.log("no focusable found");
            return;
          }

          const pin = Pin.toStartOf(prevFocusable)!;
          const after = PinnedSelection.fromPin(pin)!;
          ctx.cmd.Select(after).Dispatch();
        }
      },

      shiftRight: (ctx) => {
        preventAndStopCtx(ctx);

        const { selection } = ctx;
        const head = EmptyInline.normalizePin(selection.head).down().rightAlign;
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
        const head = EmptyInline.normalizePin(selection.head).down().leftAlign;
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

  static normalizeSelection(selection: PinnedSelection): PinnedSelection {
    const { tail, head } = selection;
    const t = EmptyInline.normalizePin(tail);
    const h = EmptyInline.normalizePin(head);
    return PinnedSelection.create(t, h);
  }

  // normalize pin to the nearest focusable node away from the inlineAtomIsolate
  static normalizePin(pin: Pin): Pin {
    const down = pin.down();
    if (EmptyInline.isPrefix(down.node)) {
      return Pin.toStartOf(down.node)!.up()!;
    }

    if (EmptyInline.isSuffix(down.node)) {
      // debugger;
      return Pin.toEndOf(down.node)!.up()!;
    }

    return pin;
  }

  static is(node: Node): boolean {
    return node.name === "empty";
  }

  static isPrefix(node: Node): boolean {
    const { nextSibling } = node;
    return <boolean>(
      (node.name === "empty" &&
        nextSibling?.isIsolate &&
        nextSibling?.isInlineAtom &&
        node.parent?.type.isInlineAtomWrapper)
    );
  }

  static isSuffix(node: Node): boolean {
    const { prevSibling } = node;
    return <boolean>(
      (node.name === "empty" &&
        prevSibling?.isIsolate &&
        prevSibling?.isInlineAtom &&
        node.parent?.type.isInlineAtomWrapper)
    );
  }
}
