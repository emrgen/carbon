import { BeforePlugin, Carbon, EventContext, EventHandler, Node, preventAndStopCtx } from "@emrgen/carbon-core";
import { BlockMenuCmd } from "../types";
import { Optional } from '@emrgen/types';
import { PluginEmitter } from "@emrgen/carbon-core/src/core/PluginEmitter";
import { PluginState } from "@emrgen/carbon-core/src/core/PluginState";

const BlockMenuRegex = /^\/([a-zA-Z0-9\s])*$/;

export class BlockMenuPlugin extends BeforePlugin {

  name = 'blockMenu';

  get visible() {
    return this.state.get('visible');
  }

  set visible(value: boolean) {
    this.state.set('visible', value);
  }

  get checked() {
    return this.state.get('checked');
  }

  set checked(value: Map<string, boolean>) {
    this.state.set('checked', value);
  }

  init(bus:PluginEmitter, state:PluginState): void {
    super.init(bus, state);

    // this.setState({
    //   visible: false,
    //   checked: new Map<string, boolean>(),
    // });
  }

  keydown(): Partial<EventHandler> {
    return {
      'up': (ctx: EventContext<KeyboardEvent>) => {
        if (this.visible) {
          preventAndStopCtx(ctx);
          ctx.app.emit(BlockMenuCmd.scrollUp);
        }
      },
      'down': (ctx: EventContext<KeyboardEvent>) => {
        if (this.visible) {
          preventAndStopCtx(ctx);
          ctx.app.emit(BlockMenuCmd.scrollDown);
        }
      },
      'enter': (ctx: EventContext<KeyboardEvent>) => {
        if (this.visible) {
          console.log('enter', ctx.node.id.toString(), this.visible);
          preventAndStopCtx(ctx);
          ctx.app.emit(BlockMenuCmd.select);
        }
      },
      'esc': (ctx: EventContext<KeyboardEvent>) => {
        if (this.visible) {
          preventAndStopCtx(ctx);
          const { node, app } = ctx;
          this.onHide(app, node, true);
        }
      }
    }
  }

  handlers(): Partial<EventHandler> {
    return {
      keyUp: this.onKeyUp.bind(this),
      // hide block menu on mouse down outside the menu
      mouseDown: (ctx: EventContext<MouseEvent>) => {
        const {node, app} = ctx;
        if (this.visible) {
          this.onHide(app, node, true);
        }
      },
    }
  }

  onKeyUp(ctx: EventContext<KeyboardEvent>) {
    const { app, node } = ctx;
    const { selection } = app;
    const {checked} = this;

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
      this.onHide(app, node, this.visible);
      return
    }
    const el = app.store.element(node.id);

    if (!el) {
      console.error("no element found for node", node);
      return;
    }

    console.log('show menu');
    this.bus.emit(node, BlockMenuCmd.show, el);
  }

  onHide(app: Carbon, node: Node, isChecked = true) {
    const {checked} = this;
    checked.set(node.id.toString(), isChecked);
    this.checked = checked;
    this.visible = false;


    app.emit(BlockMenuCmd.hide, node);
  }

}
