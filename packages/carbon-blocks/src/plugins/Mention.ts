import {
  CarbonPlugin,
  EventContext,
  EventHandlerMap,
  InlineAtom,
  NodeSpec,
} from "@emrgen/carbon-core";

export class Mention extends InlineAtom {
  name = "mention";

  override spec(): NodeSpec {
    return {
      group: "inline",
      inline: true,
      atom: true,
      isolate: true,
      mergeable: false,
      // hint that the node is not focusable (cursor can't be placed wrt this node)
      focusable: false,
      tag: "span",
    };
  }

  plugins(): CarbonPlugin[] {
    return [];
  }

  override handlers(): EventHandlerMap {
    return {
      mouseUp: this.onMouseUp,
      mouseMove: this.onMouseMove,
    };
  }

  onMouseUp(ctx: EventContext<MouseEvent>) {
    // move the cursor to the end of the mention
  }

  onMouseMove(ctx: EventContext<MouseEvent>) {
    // preventAndStopCtx(ctx);
    console.log("mention mousemove");
    // preventAndStopCtx(ctx);
  }
}

export class MentionAtom extends InlineAtom {
  name = "mentionAtom";

  override spec(): NodeSpec {
    return {
      ...super.spec(),
      focusable: false,
      isolate: true,
      atom: true,
      props: {
        local: {
          html: {
            contentEditable: false,
          },
        },
      },
    };
  }
}
