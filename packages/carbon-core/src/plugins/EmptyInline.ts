import { InlineAtom } from "./InlineAtom";
import {
  AtomContentPath,
  AtomSizePath,
  EventHandlerMap,
  LocalClassPath,
  Node,
  NodeEncoder,
  NodeSpec,
  Pin,
  PinnedSelection,
  preventAndStopCtx,
  Writer,
} from "@emrgen/carbon-core";

// <Text/><EmptyInline/><Text/><Mention><EmptyInline/></Mention/>

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
        [LocalClassPath]: "empty-zero-width-space",
      },
    };
  }

  keydown(): EventHandlerMap {
    return {
      left: (ctx) => {
        const { selection } = ctx;
        if (selection.isCollapsed) {
          preventAndStopCtx(ctx);
          const { head } = selection;
          const down = head.down()?.leftAlign;

          console.log(down?.node.name, down?.node.id.toString());
          const prevFocusable = down?.node.prev((n) => {
            console.log("prev", n.name, n.toString());
            return n.isFocusable;
          });

          if (!prevFocusable) {
            console.log("no focusable found");
            return;
          }

          const pin = Pin.toEndOf(prevFocusable)!;
          const after = PinnedSelection.fromPin(pin)!;
          ctx.cmd.Select(after).Dispatch();
        }
      },
      right: (ctx) => {
        const { currentNode, selection } = ctx;
        const down = selection.head.down();
        if (selection.isCollapsed) {
          preventAndStopCtx(ctx);

          const nextFocusable = down?.node.next((n) => n.isFocusable);
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
        const head = selection.head.down()?.rightAlign;
        const nextFocusable = head?.node.next((n) => n.isFocusable);
        if (!nextFocusable) {
          console.log("no focusable found");
          return;
        }

        const pin = Pin.toStartOf(nextFocusable)!;
        const after = PinnedSelection.create(selection.tail, pin);
        ctx.cmd.Select(after).Dispatch();
      },

      shiftLeft: (ctx) => {
        const { selection } = ctx;
        preventAndStopCtx(ctx);
        const { head } = selection;
        const down = head.down()?.leftAlign;

        console.log(down?.node.name, down?.node.id.toString());
        const prevFocusable = down?.node.prev((n) => {
          return n.isFocusable;
        });

        if (!prevFocusable) {
          console.log("no focusable found");
          return;
        }

        const pin = Pin.toEndOf(prevFocusable)!;
        const after = PinnedSelection.create(selection.tail, pin)!;
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
}
