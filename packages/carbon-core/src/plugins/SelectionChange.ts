import {
  AfterPlugin,
  Carbon,
  CarbonPlugin,
  EventContext,
  LocalClassPath,
  StateActions,
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
        console.log(p14("[event]"), "selectionchange", ctx.event);
        // helper code block to detect errant selectionchange effect
        count++;
        setTimeout(() => {
          count = 0;
        }, 1000);
        if (count > 60) {
          console.error("selectionchange happening too fast, possible bug detected");
          return;
        }
        const { app, selection: after, cmd } = ctx;

        const { selection: before } = app;
        if (before.isInvalid) {
          console.warn(
            p12("%c[invalid]"),
            "color:orange",
            "before selection is invalid",
            app.ready,
          );
        }

        if (after.isInvalid) {
          console.error(
            p14("%c[error]"),
            "color:orange",
            "failed to ge pinned selection, after selection is invalid",
          );
          return;
        }

        if (app.focused && after.eq(before) && after.isDomInSync(app.store, app.dom)) {
          console.warn(p14("%c[duplicate]"), "color:grey", before, after);
          return;
        }

        // console.log('SelectionPlugin.selectionchanged',before.toJSON(),after.toJSON());
        console.debug(p14("%c[create]"), "color:green", "select transaction");

        cmd.Select(after);
        if (ctx.app.state.blockSelection.isActive) {
          this.removeBlockSelection(ctx);
        }

        cmd.Dispatch();
      },
      selectstart: (ctx: EventContext<Event>) => {
        this.removeBlockSelection(ctx)?.Then(() => {
          ctx.app.focus();
        });
      },
    };
  }

  removeBlockSelection(ctx: EventContext<Event>) {
    const { app, cmd } = ctx;
    if (app.blockSelection.isActive) {
      console.debug(p14("[blockSelection]"), "clear");
      return cmd.SelectBlocks([]).Dispatch();
    }
  }

  plugins(): CarbonPlugin[] {
    return [new MouseSelection(), new KeyboardSelection()];
  }

  _transaction(app: Carbon, tr: StateActions) {
    const { state } = app;
    const { selection: after } = state;
    if (state.previous) {
      const { selection: before } = state.previous;
      const { blocks: beforeBlocks } = before;
      const { blocks: afterBlocks } = after;
      // find the difference between the two selections
      const added = afterBlocks.filter((block) => !beforeBlocks.includes(block));
      const removed = beforeBlocks.filter((block) => !afterBlocks.includes(block));

      if (added.length === 0 && removed.length === 0) {
        return;
      }

      const { cmd } = app;

      added.forEach((block) => {
        cmd.Update(block, {
          [LocalClassPath]: "selected",
        });
      });
      removed.forEach((block) => {
        cmd.Update(block, {
          [LocalClassPath]: "",
        });
      });

      cmd.Dispatch();
    }
  }
}
