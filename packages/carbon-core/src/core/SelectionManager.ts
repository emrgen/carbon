import { last } from 'lodash';
import { p12, p14 } from "./Logger";
import { Carbon } from './Carbon';
import { ActionOrigin } from './actions/types';
import { PointedSelection } from './PointedSelection';
import { SelectionEvent } from './SelectionEvent';
import { EventsOut } from './Event';
import { Optional } from '@emrgen/types';
import { PinnedSelection } from './PinnedSelection';

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
	onSelect(before: PointedSelection, after: PointedSelection, origin: ActionOrigin) {
		// console.log('onSelect', before.toString(), after.toString(), origin, this.enabled);
		if (!this.enabled) {
			return
		}

		const { app } = this
		// const { head, tail } = after.pin(editor)!;
		// const selectedNodes = this.state.selectedNodeIds.map(id => this.store.get(id)) as Node[];
		// selectedNodes.forEach((n) => {
		// 	if (n.isActive) return
		// 	n.updateData({ _state: { selected: false } });
		// 	this.state.runtime.selectedNodeIds.add(n.id);
		// });

		// console.log('Editor.onSelect', after.toString(), this.runtime.selectEvents.length);
		// console.log('Editor.onSelect', after.toString(), 'pendingSelection', origin);
		if ([ActionOrigin.UserSelectionChange, ActionOrigin.DomSelectionChange].includes(origin)) {
			if (app.runtime.selectEvents.length === 0) {
				// this.selectedNodesIds.clear();
				this.onSelectionChange(before, after, origin)
				// this.selectedNodesChanged()
				// this.pm.onSelect(event);
			} else {
				console.error('skipped the selection', after.toString(), before.toString());
			}
		} else {
			const event = SelectionEvent.create(before, after, origin);
			console.log('pushing selection event', event);
			this.runtime.selectEvents.push(event);
		}
	}

	// syncs selection with app state
	private onSelectionChange(before: PointedSelection, after: PointedSelection, origin: ActionOrigin) {
		const { state } = this;
		if (before.eq(after) && origin !== ActionOrigin.UserInput && origin !== ActionOrigin.Normalizer && origin !== ActionOrigin.UserSelectionChange) {
			console.info(p14('%c[info]'), 'color:pink', 'before and after selection same', before.toJSON(), after.toJSON());
			return
		}

		const selection = after.pin(state.store);
		if (!selection) {
			console.error(p12('%c[error]'), 'color:red', 'updateSelection', 'failed to get next selection');
			return
		}

		// console.log('synced selection from origin', origin)
		this.state.updateSelection(selection, origin, origin !== ActionOrigin.DomSelectionChange);
		// console.log('###', this.app.selection.toString(), selection.toString());
		this.updateFocusPlaceholder(this.state.prevSelection, selection);
		this.app.emit(EventsOut.selectionChanged, selection);
		this.app.change.update();
		this.app.emit(EventsOut.selectionUpdated, this.state);
	}

	// syncs DOM selection with Editor's internal selection state
	// this must be called after the dom is updated
	syncSelection() {
		// console.log('syncSelection', this.state.selectionOrigin, this.state.selection.toString()	);
		
		if (!this.enabled) {
			console.log('skipped: selection sync disabled');
			return
		}

		if (!this.state.isSelectionDirty) {
			console.log('skipped: selection already synced', this.state.selectionOrigin, this.state.selection.toString()	);
			return
		}

		const { app } = this;
		const { selection } = this.state;
		if (this.state.prevSelection?.eq(selection) && this.state.selectionOrigin === ActionOrigin.DomSelectionChange) {
			console.log('skipped: unchanged selection sync', this.state.selectionOrigin);
			return
		}

		if (selection.isInvalid) {
			console.warn('skipped invalid selection sync');
			app.element?.blur()
			this.state.isSelectionDirty = false;
			return
		}

		selection.syncDom(app.store);
		this.state.isSelectionDirty = false;
	}

	// updates selection state from pending selection events
	commitSelection() {
		const { app } = this
		const event = last(this.runtime.selectEvents) as Optional<SelectionEvent>;
		
		if (!event) {
			!this.app.processTick()
			return
		}
		this.runtime.selectEvents = [];

		const { after } = event;
		const selection = after.pin(app.store)
		if (!selection) {
			console.error(p12('%c[error]'), 'color:red', 'commitSelection', 'failed to get next selection');
			return
		}

		this.state.updateSelection(selection, event.origin);
		this.app.emit(EventsOut.selectionChanged, selection);
		this.updateFocusPlaceholder(this.state.prevSelection, selection);
		// if nothing was processed, emit selection changed to sync the dom
		this.app.processTick()
	}

	onSyncSelection() {
	}

	// update placeholder visibility for the focus node
	private updateFocusPlaceholder(before?: PinnedSelection, after?: PinnedSelection,) {
		return
		if (after?.isCollapsed || !after) {
			const prevNode = before?.head.node.closest(n => n.isContainerBlock);
			const currNode = after?.head.node.closest(n => n.isContainerBlock);
			if (currNode && prevNode?.eq(currNode)) return

			if (before?.isCollapsed && prevNode && prevNode?.firstChild?.isEmpty) {
				prevNode.updateAttrs({
					html: {
						'data-focused': 'false',
						placeholder: prevNode.attrs.node.emptyPlaceholder ?? ''
					},
				})
				this.runtime.updatedNodeIds.add(prevNode.id)
			}

			if (!currNode?.firstChild?.isEmpty) {
				return
			}
			currNode.updateAttrs({
				html: {
					'data-focused': 'true',
					placeholder: currNode.attrs.node.focusPlaceholder || 'Type "/" for commands'
				},
			})
			this.runtime.updatedNodeIds.add(currNode.id)
		}

	}


}
