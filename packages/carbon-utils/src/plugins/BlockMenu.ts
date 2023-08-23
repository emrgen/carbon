import { BeforePlugin, Carbon, EventContext, EventHandler, Node, preventAndStopCtx } from "@emrgen/carbon-core";
import { BlockMenuCmd } from "../types";
import { Optional } from '@emrgen/types';

const BlockMenuRegex = /^\/([a-zA-Z0-9\s])*$/;

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
          console.log('xxxxxx enter', ctx.node.id.toString(), this.state.visible);
          preventAndStopCtx(ctx);
          ctx.app.emit(BlockMenuCmd.select);
        }
      },
      'esc': (ctx: EventContext<KeyboardEvent>) => {
        if (this.state.visible) {
          preventAndStopCtx(ctx);
          const { node, app } = ctx;
          this.onHide(app, node, true);
        }
      }
    }
  }

  on(): Partial<EventHandler> {
    return {
      keyUp: this.onKeyUp.bind(this),
      // hide block menu on mouse down outside of the menu
      mouseDown: (ctx: EventContext<MouseEvent>) => {
        const {node, app} = ctx;
        if (this.state.visible) {
          this.onHide(app, node, true);
        }
      },
    }
  }

  onKeyUp(ctx: EventContext<KeyboardEvent>) {
    const { app, node } = ctx;
    const { selection } = app;
    const {checked} = this.state;

    // console.log('onKeyUp', node.textContent, ctx.node.id.toString(), checked.get(ctx.node.id.toString()), node.isEmpty);

    if (node.isEmpty) {
      this.onHide(app, node, false);
      return;
    }

    if (checked.get(node.id.toString())) {
      console.log('node is checked', checked.get(ctx.node.id.toString()));
      return;
    }

    if (!selection.isCollapsed || !node.isTextBlock || !selection.start.isAtEndOfNode(node) || !BlockMenuRegex.test(node.textContent)) {
      this.onHide(app, node, this.state.visible);
      return
    }
    const el = app.store.element(node.id);

    if (!el) {
      console.error("no element found for node", node);
      return;
    }

    console.log('show menu');
    app.emit(BlockMenuCmd.show, node, el);
  }

  onHide(app: Carbon, node: Node, isChecked = true) {
    const {checked} = this.state;
    checked.set(node.id.toString(), isChecked);
    this.setState({ checked, visible: false });
    app.emit(BlockMenuCmd.hide, node);
  }

}
