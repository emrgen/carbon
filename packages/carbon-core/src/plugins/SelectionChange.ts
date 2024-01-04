import {
  EventContext,
  AfterPlugin,
  PinnedSelection,
  preventAndStopCtx,
  NodeIdSet,
  PointedSelection, SelectedPath, CarbonPlugin
} from "@emrgen/carbon-core";
import { p12, p14 } from '../core/Logger';
import { EventHandlerMap } from '../core/types';
import { State } from '../core/State';
import { Decoration } from '../core/Decoration';
import {MouseSelection} from "./MouseSelection";
import {KeyboardSelection} from "./KeyboardSelection";

let count = 0

// handles selection change events and dispatches a transaction to update the react state
export class SelectionChangePlugin extends AfterPlugin {

	name = 'selectionChange'

	handlers(): EventHandlerMap {
		return {
			selectionchange: (ctx: EventContext<Event>) => {
        // console.debug('mouseover node', this.state.plugin('runtime')?.get('mouseOverNode')?.chain.map(n => n.name).join(' > '))
				console.log(p14('[event]'), 'selectionchange', ctx.event);
				// helper code block to detect errant selectionchange effect
				count++;
				setTimeout(() => {
					count = 0;
				}, 1000);
				if (count > 60) {
					console.error('selectionchange happening too fast, possible bug detected');
					return
				}

				const { app, selection: after, cmd } = ctx;

				const { selection: before } = app;
				if (before.isInvalid) {
					console.warn(p12('%c[invalid]'), 'color:red', 'before selection is invalid', app.ready);
				}

				if (after.isInvalid) {
					console.error(p14('%c[error]'), 'color:red', 'failed to ge pinned selection, after selection is invalid');
					return;
				}

				if (app.focused && after.eq(before)) {
					console.warn(p14('%c[duplicate]'), 'color:grey', before, after);
					return
				}

				// console.log('SelectionPlugin.selectionchanged',before.toJSON(),after.toJSON());
				console.debug(p14('%c[create]'), 'color:green', 'select transaction');

				cmd
					.Select(after)
					.Dispatch()
			},
			selectstart: (ctx: EventContext<Event>) => {
				const {app} = ctx;
				const {selection} = app;
				if (selection.isBlock) {}
			},
		}
	}

	// TODO: decorate selected nodes with halo
	decoration(state: State): Decoration[] {
		return []
	}

  plugins(): CarbonPlugin[] {
    return [
      new MouseSelection(),
      new KeyboardSelection(),
    ]
  }

}
