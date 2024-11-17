import data from "@emoji-mart/data";
import {
  ActionType,
  BeforeInputRuleHandler,
  BeforePlugin,
  Carbon,
  EventContext,
  EventHandler,
  EventHandlerMap,
  InputRule,
  Node,
  SetContentAction,
  StateActions,
} from "@emrgen/carbon-core";
import { Optional } from "@emrgen/types";
import { EmojiIndex } from "../EmojiIndex";

console.log(data);

// @ts-ignore
window.ei = EmojiIndex;

const EMOJI_REGEX = /(:[a-z_]+:|:[a-z_]+)$/;

// change :simple_smile: to 😊
export class EmojiPickerInline extends BeforePlugin {
  name = "emojiPickerInline";

  isVisible = false;
  // current active title node for emoji picker
  node: Optional<Node>;

  inlineInputRules = new BeforeInputRuleHandler(
    [new InputRule(EMOJI_REGEX, this.intoEmoji())],
    {
      skipAfterInput: true,
    },
  );

  handlers(): Partial<EventHandler> {
    return {
      beforeInput: (ctx: EventContext<KeyboardEvent>) => {
        this.checkInputRules(ctx);
      },
    };
  }

  keydown(): EventHandlerMap {
    return {
      enter: (ctx: EventContext<KeyboardEvent>) => {
        if (this.isVisible) {
          this.hideEmojiPicker();
        }
      },
      left: (ctx: EventContext<KeyboardEvent>) => {
        if (this.isVisible) {
          this.hideEmojiPicker();
        }
      },
      right: (ctx: EventContext<KeyboardEvent>) => {
        if (this.isVisible) {
          this.hideEmojiPicker();
        }
      },
      up: (ctx: EventContext<KeyboardEvent>) => {
        if (this.isVisible) {
          this.hideEmojiPicker();
        }
      },
      down: (ctx: EventContext<KeyboardEvent>) => {
        if (this.isVisible) {
          this.hideEmojiPicker();
        }
      },
      shiftLeft: (ctx: EventContext<KeyboardEvent>) => {
        if (this.isVisible) {
          this.hideEmojiPicker();
        }
      },
      shiftRight: (ctx: EventContext<KeyboardEvent>) => {
        if (this.isVisible) {
          this.hideEmojiPicker();
        }
      },
      shiftUp: (ctx: EventContext<KeyboardEvent>) => {
        if (this.isVisible) {
          this.hideEmojiPicker();
        }
      },
      shiftDown: (ctx: EventContext<KeyboardEvent>) => {
        if (this.isVisible) {
          this.hideEmojiPicker();
        }
      },
      backspace: (ctx: EventContext<KeyboardEvent>) => {
        if (this.isVisible) {
          this.hideEmojiPicker();
        }
      },
    };
  }

  // TODO: check regex for emoji picker after the transaction
  // if the emoji picker is visible, hide it if the user input does not match the emoji pattern
  // if the emoji picker is not visible, show it if the user input matches the emoji pattern
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
      this.hideEmojiPicker();
    }
  }

  intoEmoji() {
    return (ctx: EventContext<KeyboardEvent>, regex: RegExp, text: string) => {
      this.node = ctx.currentNode.closest((n) => n.isTextContainer)!;
      const match = text.match(regex);
      const matchText = match![0];
      if (matchText.trim() !== matchText) {
        this.isVisible && this.hideEmojiPicker();
        return;
      }

      this.isVisible = true;
      this.showEmojiPicker(ctx.currentNode, matchText);
    };
  }

  showEmojiPicker(node, text) {
    this.isVisible = true;
    this.app.emit("show:emoji-picker", {
      node,
      text,
    });
  }

  hideEmojiPicker() {
    this.isVisible = false;
    this.app.emit("hide:emoji-picker", {});
  }

  transaction(app: Carbon, tr: StateActions) {
    const { selection, blockSelection } = app;
    if (blockSelection.isActive) return;
    const { head } = selection;
    const { node: title } = head;

    if (title.isEmpty) {
      if (this.isVisible) {
        this.isVisible = false;
        this.hideEmojiPicker();
      }
      return;
    }

    const contentChanged = tr.actions.some((a) => {
      if (a.type === ActionType.content) {
        if (a instanceof SetContentAction) {
          const { nodeId } = a;
          if (this.node?.id.eq(nodeId)) {
            return true;
          }
        }
      }

      return false;
    });

    if (!contentChanged) {
      if (this.isVisible) {
        this.hideEmojiPicker();
        return;
      }
    }

    // TODO: check if the emoji picker should be shown for the current title node
    // console.log("checking emoji", title);
  }
}
