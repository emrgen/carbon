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

  init(app: Carbon, bus:PluginEmitter, state:PluginState): void {
    super.init(app, bus, state);
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
          console.log('enter', ctx.currentNode.id.toString(), this.visible);
          preventAndStopCtx(ctx);
          ctx.app.emit(BlockMenuCmd.select);
        }
      },
      'esc': (ctx: EventContext<KeyboardEvent>) => {
        if (this.visible) {
          preventAndStopCtx(ctx);
          const { currentNode, app } = ctx;
          this.onHide(app, currentNode, true);
        }
      }
    }
  }

  handlers(): Partial<EventHandler> {
    return {
      keyUp: this.onKeyUp.bind(this),
      // hide block menu on mouse down outside the menu
      mouseDown: (ctx: EventContext<MouseEvent>) => {
        const {currentNode, app} = ctx;
        if (this.visible) {
          this.onHide(app, currentNode, true);
        }
      },
    }
  }

  onKeyUp(ctx: EventContext<KeyboardEvent>) {
    const { app, currentNode } = ctx;
    const { selection } = app;
    const {checked} = this;

    // console.log('onKeyUp', node.textContent, ctx.node.id.toString(), checked.get(ctx.node.id.toString()), node.isEmpty);

    if (currentNode.isEmpty) {
      this.onHide(app, currentNode, false);
      return;
    }

    if (checked.get(currentNode.id.toString())) {
      console.log('node is checked', checked.get(ctx.currentNode.id.toString()));
      return;
    }

    if (!selection.isCollapsed || !currentNode.isTextContainer || !selection.start.isAtEndOfNode(currentNode) || !BlockMenuRegex.test(currentNode.textContent)) {
      this.onHide(app, currentNode, this.visible);
      return
    }
    const el = app.store.element(currentNode.id);

    if (!el) {
      console.error("no element found for node", currentNode);
      return;
    }

    console.log('show menu');
    this.bus.emit(currentNode, BlockMenuCmd.show, el);
  }

  onHide(app: Carbon, node: Node, isChecked = true) {
    const {checked} = this;
    checked.set(node.id.toString(), isChecked);
    this.checked = checked;
    this.visible = false;


    app.emit(BlockMenuCmd.hide, node);
  }

}
