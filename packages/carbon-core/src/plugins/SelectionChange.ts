import { EventContext } from '../core/EventContext';
import { p12, p14 } from '../core/Logger';
import { AfterPlugin } from '../core/CarbonPlugin';
import { EventHandlerMap } from '../core/types';
import { CarbonState } from '../core/CarbonState';
import { Decoration } from '../core/Decoration';
import { ActionOrigin } from '../core';

let count = 0

// handles selection change events and dispatches a transaction to update the app state
export class SelectionChangePlugin extends AfterPlugin {

	name = 'selectionChange'

	on(): EventHandlerMap {
		return {
			selectionchange: (ctx: EventContext<Event>) => {
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

				const { app, selection: after } = ctx;
				console.log(after.toString());

				const { selection: before } = app;
				if (before.isInvalid) {
					console.warn(p12('%c[invalid]'), 'color:red', 'before selection is invalid');
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
				console.log(p14('%c[create]'), 'color:green', 'select transaction');
				const { tr } = app;
				if (!app.nodeSelection.isEmpty) {
					tr.selectNodes([]);
				}
				tr
					.select(after)
					.dispatch()
			},
		}
	}

	// TODO: decorate selected nodes with halo
	decoration(state: CarbonState): Decoration[] {
		return []
	}

}
