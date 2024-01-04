import {
  EventContext,
  AfterPlugin,
  PinnedSelection,
  preventAndStopCtx,
  NodeIdSet,
  PointedSelection, SelectedPath
} from "@emrgen/carbon-core";
import { p12, p14 } from '../core/Logger';
import { EventHandlerMap } from '../core/types';
import { State } from '../core/State';
import { Decoration } from '../core/Decoration';

let count = 0

// handles selection change events and dispatches a transaction to update the react state
export class SelectionChangePlugin extends AfterPlugin {

	name = 'selectionChange'

	handlers(): EventHandlerMap {
    // return {}

		return {
      mouseMove: (ctx: EventContext<Event>) => {
        console.log('mouseMove', ctx.event)
      },
      _mouseDown: (ctx: EventContext<Event>) => {
        const {selection} = ctx.app;
        if (!selection.isCollapsed) return

        this.state.set('mousedown', true);
        this.state.set('mousedownselection', false);
        const before = PinnedSelection.fromDom(ctx.app.store);

        const onMouseUp = (e) => {
          const after = PinnedSelection.fromDom(ctx.app.store);

          // if the initial selection during mouse down is not same as the selection during mouse up
          // then we are selecting using mouse and not using keyboard
          this.state.set('mousedown', false);
          this.state.set('mousedownselection', false);
          window.removeEventListener('mouseup', onMouseUp);

          if (before && after && !before.eq(after)) {
            // ctx.react.cmd.Select(after).Dispatch();
            console.log('selecting using mouse')
            return
          }
        }

        window.addEventListener('mouseup', onMouseUp, {once: true});
      },

			selectionchange: (ctx: EventContext<Event>) => {
        console.debug('mouseover node', this.state.plugin('runtime')?.get('mouseOverNode')?.chain.map(n => n.name).join(' > '))
        // const mousedown = this.state.get('mousedown');
        // const mousedownselection = this.state.get('mousedownselection');
        // console.log('mousedown', mousedown, 'mousedownselection', mousedownselection)
        // if (mousedown) {
        //   if (mousedownselection) {
        //     console.log('selecting using mouse')
        //     // return
        //   }
        //   console.log('first selection after mousedown')
        //   this.state.set('mousedownselection', true);
        // }
        // console.log('selectionchange', ctx.event)

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

        // update selection nodes
        if (after.isInline) {
          const old = NodeIdSet.fromIds(app.selection.nodes.map(n => n.id));
          const pinned = after.pin(app.store.nodeMap)!;
          if (pinned) {
            const nids = pinned.blocks.map(n => n.id);
            const now = NodeIdSet.fromIds(nids);
            console.log(nids, pinned.nodes, pinned.head.node, pinned.tail.node)

            const selection = PointedSelection.create(pinned.tail.point, pinned.head.point, nids, pinned.origin);

            // find removed block selection
            old.diff(now).forEach(id => {
              cmd.Update(id, {
                [SelectedPath]: false
              });
            })

            // find new block selection
            now.diff(old).forEach(id => {
              cmd.Update(id, {
                [SelectedPath]: true
              });
            })

            console.debug('selection nodes', pinned.nodes.map(n => n.name), nids)
            cmd.Select(selection).Dispatch();
            return;
          }
        }
        console.debug('xxxxxxxxxxxxxxxxxx')
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

}
