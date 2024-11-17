import { BeforeInputRuleHandler, BeforePlugin, EventContext, EventHandler, EventHandlerMap, InputRule } from "@emrgen/carbon-core";
import data from '@emoji-mart/data'
import { EmojiIndex } from "../EmojiIndex";

console.log(data);

// @ts-ignore
window.ei = EmojiIndex;

// change :simple_smile: to 😊
export class EmojiPickerInline extends BeforePlugin {
  name = "emojiPickerInline";

  isVisible = false;

  inlineInputRules = new BeforeInputRuleHandler([
    new InputRule(/:[a-z_]+:?(\s)/,
      this.intoEmoji(),
    ),
  ])

  handlers(): Partial<EventHandler> {
    return {
      beforeInput: (ctx: EventContext<KeyboardEvent>) => {
        this.checkInputRules(ctx);
      },
    };
  }

  checkInputRules(ctx: EventContext<KeyboardEvent>) {
    const { currentNode } = ctx;
    const block = currentNode.closest((n) => n.isContainer)!;

    if (this.inlineInputRules.execute(ctx, block)) {
      console.log("done...");
      return;
    }

    // if the emoji picker is visible, hide it as the user input does not match the emoji pattern
    if (this.isVisible) {
      this.isVisible = false;
      this.app.emit("hide:emoji-picker", {});
    }
  }

  intoEmoji() {
    return (ctx: EventContext<KeyboardEvent>, regex: RegExp, text: string) => {
      console.log("Matched emoji pattern", text);
      
      if (text.trim() !== text) {
        if (this.isVisible) {
          this.isVisible = false;
          this.app.emit("hide:emoji-picker", {});
        }
        return
      }

      this.isVisible = true;
      this.app.emit("show:emoji-picker", {
        node: ctx.currentNode,
        text,
      });
    };
  }
}
