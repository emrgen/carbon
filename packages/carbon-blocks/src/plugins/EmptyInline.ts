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

//

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
        const { currentNode, selection } = ctx;
        const { start } = selection;
        const down = start.down();
        if (selection.isCollapsed && down.offset === 0) {
          preventAndStopCtx(ctx);
          const focusable = down.node.next((n) => {
            console.log(n.name, n.isFocusable);
            return n.isFocusable;
          });
          if (!focusable) {
            console.log("no focusable");
            return;
          }

          if (focusable.name === "empty") {
            const { nextSibling } = focusable;
            // cannot move cursor to the next empty node between two adjacent empty nodes
            if (nextSibling?.isIsolate && nextSibling?.isInlineAtom) {
              throw new Error(
                "Cannot move cursor to the next empty node between two adjacent empty nodes",
              );
            }

            const pin = Pin.toEndOf(focusable)!;
            const after = PinnedSelection.fromPin(pin)!;
            ctx.cmd.Select(after).Dispatch();
          }
        }
      },
      left: (ctx) => {
        const { currentNode, selection } = ctx;
        const { start } = selection;
        const down = start.down();
        if (selection.isCollapsed && down.offset === 1) {
          preventAndStopCtx(ctx);
          const focusable = down.node.prev((n) => {
            console.log(n.name, n.isFocusable);
            return n.isFocusable;
          });
          if (!focusable) {
            console.log("no focusable");
            return;
          }

          if (focusable.name === "empty") {
            const { prevSibling } = focusable;
            // cannot move cursor to the next empty node between two adjacent empty nodes
            if (prevSibling?.isIsolate && prevSibling?.isInlineAtom) {
              throw new Error(
                "Cannot move cursor to the next empty node between two adjacent empty nodes",
              );
            }

            const pin = Pin.toStartOf(focusable)!;
            const after = PinnedSelection.fromPin(pin)!;
            ctx.cmd.Select(after).Dispatch();
          }
        }
      },
    };
  }

  static isPrefix(node: Node): boolean {
    const { nextSibling } = node;
    return <boolean>(
      (node.name === "empty" &&
        nextSibling?.isIsolate &&
        nextSibling?.isInlineAtom)
    );
  }

  static isSuffix(node: Node): boolean {
    const { prevSibling } = node;
    return <boolean>(
      (node.name === "empty" &&
        prevSibling?.isIsolate &&
        prevSibling?.isInlineAtom)
    );
  }
}
