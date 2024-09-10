import {
  CarbonPlugin,
  EventContext,
  EventHandlerMap,
  InlineAtom,
  NodeSpec,
} from "@emrgen/carbon-core";

export class Mention extends CarbonPlugin {
  name = "mention";

  override spec(): NodeSpec {
    return {
      group: "inline",
      content: "empty mentionAtom empty",
      inline: true,
      mergeable: false,
      inlineAtomWrapper: true,
      // inlineSelectable: true,
      focusable: false,
      tag: "span",
    };
  }

  plugins(): CarbonPlugin[] {
    return [new MentionAtom()];
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
