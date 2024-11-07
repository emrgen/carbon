import {
  AfterPlugin,
  CarbonPlugin,
  EventContext,
  SelectedPath,
} from "@emrgen/carbon-core";
import { p12, p14 } from "../core/Logger";
import { EventHandlerMap } from "../core/types";
import { KeyboardSelection } from "./KeyboardSelection";
import { MouseSelection } from "./MouseSelection";

let count = 0;

// handles selection change events and dispatches a transaction to update the react state
export class SelectionChangePlugin extends AfterPlugin {
  name = "selectionChange";

  handlers(): EventHandlerMap {
    return {
      dragStart: (ctx: EventContext<Event>) => {
        // ctx.event.preventDefault();
        console.log(p14("[event]"), "dragStart", ctx.event);
      },
      selectionchange: (ctx: EventContext<Event>) => {
        // if (ctx.app.runtime.mousedown) {
        //   ctx.app.runtime.selectionchange = true;
        //   ctx.app.runtime.selection = ctx.selection;
        //   console.log('selectionchange while selecting, ignore')
        //   return;
        // }

        // console.debug('mouseover node', this.state.plugin('runtime')?.get('mouseOverNode')?.chain.map(n => n.name).join(' > '))
        // console.log(p14('[event]'), 'selectionchange', ctx.event);
        // helper code block to detect errant selectionchange effect
        count++;
        setTimeout(() => {
          count = 0;
        }, 1000);
        if (count > 60) {
          console.error(
            "selectionchange happening too fast, possible bug detected",
          );
          return;
        }

        const { app, selection: after, cmd } = ctx;

        const { selection: before } = app;
        if (before.isInvalid) {
          console.warn(
            p12("%c[invalid]"),
            "color:red",
            "before selection is invalid",
            app.ready,
          );
        }

        if (after.isInvalid) {
          console.error(
            p14("%c[error]"),
            "color:red",
            "failed to ge pinned selection, after selection is invalid",
          );
          return;
        }

        if (
          app.focused &&
          after.eq(before) &&
          after.isDomInSync(app.store, app.dom)
        ) {
          console.warn(p14("%c[duplicate]"), "color:grey", before, after);
          return;
        }

        // console.log('SelectionPlugin.selectionchanged',before.toJSON(),after.toJSON());
        console.debug(p14("%c[create]"), "color:green", "select transaction");
        // this.selected.clear();
        // after.blocks.forEach(block => {
        //   this.selected.add(block.id)
        // });

        cmd.Select(after);
        if (ctx.app.state.blockSelection.isActive) {
          this.removeBlockSelection(ctx);
        }
        cmd.Dispatch();
      },
      selectstart: (ctx: EventContext<Event>) => {
        // this.removeBlockSelection(ctx);
        // ctx.cmd.Dispatch();
      },
    };
  }

  removeBlockSelection(ctx: EventContext<Event>) {
    const { app, cmd } = ctx;
    const { blockSelection } = app.state;
    blockSelection.blocks.forEach((block) => {
      cmd.Update(block.id, { [SelectedPath]: false });
    });
  }

  plugins(): CarbonPlugin[] {
    return [new MouseSelection(), new KeyboardSelection()];
  }
}
