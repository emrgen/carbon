import { BeforePlugin, Carbon, EventContext, EventHandler, Node } from "@emrgen/carbon-core";
import { BlockMenuCmd } from "../types";
import { Optional } from '@emrgen/types';


export class BlockMenuPlugin extends BeforePlugin {

  name = 'blockMenu';

  init(app: Carbon): void {
    // console.log('create block names list');
  }

  on(): Partial<EventHandler> {
    return {
      'keyUp': this.onKeyUp.bind(this),
    }
  }

  onKeyUp(ctx: EventContext<KeyboardEvent>) {
    const { app, node } = ctx;
    if (!node.isTextBlock) return

    app.emit(BlockMenuCmd.check, node);
  }
}
