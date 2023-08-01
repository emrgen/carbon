import { BeforePlugin, Carbon, EventContext, EventHandler, Node, preventAndStopCtx } from "@emrgen/carbon-core";
import { BlockMenuCmd } from "../types";
import { Optional } from '@emrgen/types';

const BlockMenuRegex = /^\/([a-zA-Z])*$/;

export class BlockMenuPlugin extends BeforePlugin {

  name = 'blockMenu';

  init(app: Carbon): void {
    super.init(app);

    this.setState({
      visible: false,
      checked: new Map<string, boolean>(),
    });
  }

  keydown(): Partial<EventHandler> {
    return {
      'up': (ctx: EventContext<KeyboardEvent>) => {
        if (this.state.visible) {
          preventAndStopCtx(ctx);
          ctx.app.emit(BlockMenuCmd.scrollUp);
        }
      },
      'down': (ctx: EventContext<KeyboardEvent>) => {
        if (this.state.visible) {
          preventAndStopCtx(ctx);
          ctx.app.emit(BlockMenuCmd.scrollDown);
        }
      },
      'enter': (ctx: EventContext<KeyboardEvent>) => {
        if (this.state.visible) {
          preventAndStopCtx(ctx);
          ctx.app.emit(BlockMenuCmd.select);
        }
      },
      'esc': (ctx: EventContext<KeyboardEvent>) => {
        if (this.state.visible) {
          preventAndStopCtx(ctx);
          const {checked} = this.state;
          checked.set(ctx.node.id.toString(), true);
          this.setState({ checked });

          ctx.app.emit(BlockMenuCmd.hide);
        }
      }
    }
  }

  on(): Partial<EventHandler> {
    return {
      keyUp: this.onKeyUp.bind(this),
      mouseDown: (ctx: EventContext<MouseEvent>) => {
        if (this.state.visible) {
          ctx.app.emit(BlockMenuCmd.hide);
        }
      },
    }
  }

  onKeyUp(ctx: EventContext<KeyboardEvent>) {
    const { app, node } = ctx;
    const { selection } = app;
    const {checked} = this.state;

    if (node.isEmpty) {
      checked.set(ctx.node.id.toString(), false);
      this.setState({ checked });
      return;
    }

    if (checked.get(node.id.toString())) {
      return;
    }

    if (!selection.isCollapsed || !node.isTextBlock || !selection.start.isAtEndOfNode(node) || !BlockMenuRegex.test(node.textContent)) {
      app.emit(BlockMenuCmd.hide, node);
      return
    }
    const el = app.store.element(node.id);

    if (!el) {
      console.error("no element found for node", node);
      return;
    }

    app.emit(BlockMenuCmd.show, node, el);
  }
}
