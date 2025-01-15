import {
  ActionType,
  BeforePlugin,
  Carbon,
  EventContext,
  EventHandler,
  preventAndStopCtx,
  StateActions,
} from "@emrgen/carbon-core";
import { BlockMenuCmd } from "../types";

const BlockMenuRegex = /^\/([a-zA-Z0-9\s])*$/;

export class BlockMenuPlugin extends BeforePlugin {
  name = "blockMenu";

  created() {
    this.state.set("visible", false);
    this.state.set("checked", new Map<string, boolean>());
  }

  get visible() {
    return this.state.get("visible");
  }

  set visible(value: boolean) {
    this.state.set("visible", value);
  }

  get checked() {
    return this.state.get("checked");
  }

  set checked(value: Map<string, boolean>) {
    this.state.set("checked", value);
  }

  keydown(): Partial<EventHandler> {
    return {
      up: (ctx: EventContext<KeyboardEvent>) => {
        if (this.visible) {
          preventAndStopCtx(ctx);
          ctx.app.emit(BlockMenuCmd.scrollUp);
        }
      },
      down: (ctx: EventContext<KeyboardEvent>) => {
        if (this.visible) {
          preventAndStopCtx(ctx);
          ctx.app.emit(BlockMenuCmd.scrollDown);
        }
      },
      enter: (ctx: EventContext<KeyboardEvent>) => {
        if (this.visible) {
          console.log("enter", ctx.currentNode.id.toString(), this.visible);
          preventAndStopCtx(ctx);
          ctx.app.emit(BlockMenuCmd.select);
        }
      },
      esc: (ctx: EventContext<KeyboardEvent>) => {
        if (this.visible) {
          preventAndStopCtx(ctx);
          const { app } = ctx;
          this.onHide(app);
        }
      },
    };
  }

  handlers(): Partial<EventHandler> {
    return {
      // hide block menu on mouse down outside the menu
      mouseDown: (ctx: EventContext<MouseEvent>) => {
        const { app } = ctx;
        if (this.visible) {
          this.onHide(app);
        }
      },
    };
  }

  // check if the inserted text matches any block info entries
  // if it does, show the block menu
  // if it doesn't, hide the block menu
  transaction(app: Carbon, tr: StateActions) {
    const { selection, blockSelection } = app;
    if (blockSelection.isActive) return;
    const { head } = selection;
    const { node: title } = head;

    const { checked } = this;

    if (title.parent?.isPage) {
      return;
    }

    if (title.isEmpty) {
      checked.delete(title.id.toString());
      if (this.visible) {
        this.onHide(app);
      }
      return;
    }

    if (!tr.actions.some((a) => a.type === ActionType.content)) {
      if (this.visible) {
        this.onHide(app);
      }
      return;
    }

    if (checked.get(title.id.toString())) {
      this.onHide(app);
      return;
    }

    if (
      !selection.isCollapsed ||
      !selection.start.isAtEndOfNode(title) ||
      !BlockMenuRegex.test(title.textContent)
    ) {
      this.onHide(app);
      return;
    }

    const el = app.store.element(title.id);
    if (!el) {
      console.error("no element found for node", title);
      return;
    }

    app.emit(BlockMenuCmd.show, title, this.state);
  }

  setState(key: string, value: any) {
    this.state.set(key, value);
  }

  onHide(app: Carbon) {
    const { checked } = this;
    this.checked = checked;
    this.visible = false;
    app.emit(BlockMenuCmd.hide, this.state);
  }
}
