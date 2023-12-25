import { last } from 'lodash';
import { p12, p14 } from "./Logger";
import { Carbon } from './Carbon';
import { ActionOrigin } from './actions/types';
import { PointedSelection } from './PointedSelection';
import { SelectionEvent } from './SelectionEvent';
import { EventsOut } from './Event';
import { Optional } from '@emrgen/types';
import { PinnedSelection } from './PinnedSelection';
import { ImmutableDraft } from './ImmutableDraft';
import {Draft} from "./Draft";

export class SelectionManager {
	focused = false;

	constructor(readonly app: Carbon) { }

	private get runtime() {
		return this.app.runtime;
	}

	private get state() {
		return this.app.state;
	}

	get enabled() {
		return this.app.enabled
	}

	focus() {
		this.app.element?.focus()
		this.focused = true;
	}

	blur() {
		this.app.element?.blur()
		this.focused = false;
	}

	// syncs selection with dom depending on `origin`
	// used by commands to inform editor of a selection change
	// the selection might be queued
	onSelect(draft: Draft, before: PointedSelection, after: PointedSelection, origin: ActionOrigin) {
		// console.log('onSelect', before.toString(), after.toString(), origin, this.enabled);
		// if (!this.enabled) {
		// 	// console.log('skipped: react selection disabled');
		// 	return
		// }

		const { app } = this;

		// console.log('Editor.onSelect', after.toString(), 'pendingSelection', origin);
		if (after.isInline && [ActionOrigin.UserSelectionChange, ActionOrigin.DomSelectionChange].includes(origin)) {
			this.onSelectionChange(draft, before, after, origin)
		} else {
			const event = SelectionEvent.create(before, after, origin);
			// console.log('pushing selection event to draft for next state', event);
			draft.updateSelection(after);
		}
	}

	// syncs selection with react dom state
	private onSelectionChange(draft: Draft, before: PointedSelection, after: PointedSelection, origin: ActionOrigin) {
		const { state } = this;
		if (before.eq(after) && origin !== ActionOrigin.UserInput && origin !== ActionOrigin.Normalizer && origin !== ActionOrigin.UserSelectionChange) {
			console.info(p14('%c[info]'), 'color:pink', 'before and after selection same', before.toJSON(), after.toJSON());
			return
		}

		// this is just a sanity check
		const selection = after.pin(state.nodeMap);
		if (!selection) {
			console.error(p12('%c[error]'), 'color:red', 'updateSelection', 'failed to get next selection');
			return
		}

		draft.updateSelection(after);
		console.log('synced selection from origin', origin)
		// this.state.updateSelection(selection, origin, origin !== ActionOrigin.DomSelectionChange && origin !== ActionOrigin.NoSync);
		// console.log('###', this.react.selection.toString(), selection.toString());
		// this.updateFocusPlaceholder(this.state.prevSelection, selection);
		// this.react.change.update();
		// this.react.emit(EventsOut.selectionUpdated, this.state);
	}

	// update placeholder visibility for the focus node
	private updateFocusPlaceholder(before?: PinnedSelection, after?: PinnedSelection,) {
		// if (after?.isCollapsed || !after) {
		// 	const prevNode = before?.head.node.closest(n => n.isContainerBlock);
		// 	const currNode = after?.head.node.closest(n => n.isContainerBlock);
		// 	if (currNode && prevNode?.eq(currNode)) return

		// 	if (before?.isCollapsed && prevNode && prevNode?.firstChild?.isEmpty) {
		// 		prevNode.updateAttrs({
		// 			html: {
		// 				'data-focused': 'false',
		// 				placeholder: prevNode.attrs.node.emptyPlaceholder ?? ''
		// 			},
		// 		})
		// 		this.runtime.updatedNodeIds.add(prevNode.id)
		// 	}

		// 	if (!currNode?.firstChild?.isEmpty) {
		// 		return
		// 	}
		// 	currNode.updateAttrs({
		// 		html: {
		// 			'data-focused': 'true',
		// 			placeholder: currNode.attrs.node.focusPlaceholder || 'Type "/" for commands'
		// 		},
		// 	})
		// 	this.runtime.updatedNodeIds.add(currNode.id)
		// }

	}
}
