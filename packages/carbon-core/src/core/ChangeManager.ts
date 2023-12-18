import { each, identity } from 'lodash';
import { NodeIdSet } from './BSet';
import { Carbon } from './Carbon';
import { Node } from "./Node";
import { NodeTopicEmitter } from './NodeEmitter';
import { SelectionManager } from './SelectionManager';
import { TransactionManager } from './TransactionManager';
import { EventsOut } from './Event';
import { Transaction } from './Transaction';
import { StateChanges } from './NodeChange';
import { PluginManager } from './PluginManager';
import { NodeId } from './NodeId';

export enum NodeChangeType {
	update = 'update',
}

/**
 * Syncs the editor state with the UI
 */
export class ChangeManager extends NodeTopicEmitter<NodeChangeType> {

	readonly transactions: Transaction[] = []
	changes: NodeIdSet = NodeIdSet.empty();

	constructor(
		private readonly app: Carbon,
		private readonly sm: SelectionManager,
		private readonly tm: TransactionManager,
		private readonly pm: PluginManager
	) {
		super();
	}

	private get state() {
		return this.app.state;
	}

	private get store() {
		return this.state.nodeMap;
	}

	private get isContentSynced() {
		return !this.changes.size
	}

	private get isSelectionDirty() {
		return this.state.isSelectionChanged;
	}

	// 1. sync the doc
	// 2. sync the selection
	// 3. sync the node state
	update(tr: Transaction) {
		if (this.transactions.length) {
			return
		}

		this.transactions.push(tr);
		const { isContentChanged, isSelectionChanged } = this.state;

		// console.log('updating transaction effect', tr);
		// console.log('update', isContentDirty, isNodeStateDirty, isSelectionDirty);
		// if nothing is dirty, then there is nothing to do
		if (!isContentChanged && !isSelectionChanged) {
			return
		}

		if (isContentChanged) {
			this.changes.clear();
			this.changes = this.state.changes.clone();
		}
		if (isContentChanged) {
			this.updateContent();
			return
		}

		if (isSelectionChanged) {
			this.updateSelection(() => {
				this.onTransaction();
			})
		}
	}

	mounted(node: Node, changeType: NodeChangeType) {
		if (!this.changes.has(node.id)) {
			// console.log('mounted node not dirty', node.id.toString(), changeType);
			return
		}

		// console.log('mounted', node.id.toString(), changeType);

		// keep track of the pending node updates
		if (changeType === NodeChangeType.update) {
		  // console.log('mounted', node.id.toString(), changeType, this.changes.changed.size, this.changes.changed.toArray().map(n => n.toString()), node.textContent, node);
			this.changes.remove(node.id);
		}

		// console.log('mounted', this.isContentSynced, this.state.isSelectionDirty);
		if (this.isContentSynced) {
			this.app.emit(EventsOut.contentUpdated, this.state.content);
		}

		// console.log('mounted', this.changes.size, this.changes.toArray().map(n => n.toString()));

		// sync the selection if the content is synced
		// console.log('mounted', this.state.runtime.updatedNodeIds.toArray().map(n => n.toString()), node.id.toString(), this.isContentSynced, this.isStateSynced, this.state.isSelectionDirty);
		if (this.isContentSynced) {
			console.debug('content synced', this.isSelectionDirty);
			// NOTE: if the last transaction did not update the selection, we can go ahead and process the next tick
			if (this.isSelectionDirty) {
				this.updateSelection(() => {
					this.onTransaction();
				});
			} else {
				this.onTransaction();
				// this.app.processTick();
			}
		}
	}

	private onTransaction() {
		const tr = this.transactions.shift()
		if (tr) {
			this.pm.onTransaction(tr);
			this.app.emit(EventsOut.transaction, tr);
			this.app.emit(EventsOut.changed, this.state);
		}
	}

	private updateContent() {
		console.groupCollapsed('syncing:  content');
		// console.group('syncing: content')
		const updatedNodeIds = this.changes;
		const updatedNodes = updatedNodeIds.map(n => this.store.get(n)).filter(identity) as Node[];

		console.log('updatedNodes', updatedNodes.map(n => n.id.toString()), updatedNodeIds.toArray().map(n => n.toString()));

		// remove nodes if ancestor is present in the updateNodes
		// this is needed to avoid updating the same node twice
		// as updating(rendering) the ancestor will update the descendants as well
		updatedNodes.forEach(n => {
			updatedNodeIds.remove(n.id);
			if (n.closest(p => updatedNodeIds.has(p.id))) {
				return
			}
			updatedNodeIds.add(n.id);
		});

		console.log('publish', updatedNodes.map(n => n.id.toString()));

		updatedNodes
			.filter(n => updatedNodeIds.has(n.id))
			.forEach( n => this.publish(NodeChangeType.update, n, n.parent));
		console.groupEnd()
	}

	private updateSelection(cb: Function) {
		const selection = this.state.selection;
		console.debug('syncing: selection', this.state.selection.toJSON(), this.state.selection.isInline);
		if (!this.app.ready) {
			// console.log('app not ready');
			return
		}

		// this.app.enable();

		if (selection.isInline) {
			this.sm.syncSelection();
		}
		this.app.emit(EventsOut.selectionUpdated, this.state.selection);
		cb();

		// process pending transactions
		// this.tm.dispatch();
		// console.groupEnd();
	}

}
