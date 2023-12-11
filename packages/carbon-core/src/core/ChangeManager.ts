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

export enum NodeChangeType {
	update = 'update',
	state = 'state',
}

/**
 * Syncs the editor state (iow content and selection) with the UI
 */
export class ChangeManager extends NodeTopicEmitter<NodeChangeType> {

	readonly transactions: Transaction[] = []
	changes: StateChanges = new StateChanges();

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
		return !this.changes.isContentDirty
	}

	private get isStateSynced() {
		return !this.state.runtime.isNodeStateDirty
	}

	// 1. sync the doc
	// 2. sync the selection
	// 3. sync the node state
	update(tr: Transaction) {
		this.transactions.push(tr);
		const { isContentDirty, isNodeStateDirty, isSelectionDirty } = this.state.changes;

		// console.log('updating transaction effect', tr);
		// console.log('update', isContentDirty, isNodeStateDirty, isSelectionDirty);
		// if nothing is dirty, then there is nothing to do
		if (!isContentDirty && !isNodeStateDirty && !isSelectionDirty) {
			return
		}

		this.changes = this.state.changes.clone();

		if (isContentDirty) {
			console.log(isSelectionDirty, isNodeStateDirty);
			this.updateContent();
			// console.log('updating content');
			if (isNodeStateDirty) {
				// console.log('updating states');
				this.updateNodeState();
			}
			return
		}

		if (isNodeStateDirty) {
			// console.log('updating states');
			this.updateNodeState();
			return
		}

		if (isSelectionDirty) {
			console.log('updating selection');
			this.updateSelection(() => {
				this.onTransaction();
			})
		}
	}

	mounted(node: Node, changeType: NodeChangeType) {
		// console.log('mounted', node.id.toString(), changeType);

		// keep track of the pending node updates
		if (changeType === NodeChangeType.update) {
			this.state.runtime.updatedNodeIds.remove(node.id);
		}

		// console.log('mounted', this.isContentSynced, this.state.isSelectionDirty);
		if (this.isContentSynced) {
			this.app.emit(EventsOut.contentUpdated, this.state.content);
		}

		// FIXME: this is a unreliable hack, may not indicate the correct state of updated nodes
		if (this.isStateSynced) {
			this.app.emit(EventsOut.nodeStateUpdated, this.state);
		}

		// console.log('--------', node.id.toString(), this.isContentSynced, this.isStateSynced, this.state.isSelectionDirty);
		// sync the selection if the content is synced
		// console.log(this.state.runtime.updatedNodeIds.toArray().map(n => n.toString()), this.isStateSynced, this.state.isSelectionDirty);

		// console.log('mounted', this.state.runtime.updatedNodeIds.toArray().map(n => n.toString()), node.id.toString(), this.isContentSynced, this.isStateSynced, this.state.isSelectionDirty);
		if (this.isContentSynced) {
			// NOTE: if the last transaction did not update the selection, we can go ahead and process the next tick
			if (this.state.changes.isSelectionDirty) {
				// console.log('updating selection', first(this.transactions));
				this.updateSelection(() => {
					this.onTransaction();
				});
			} else {
				this.onTransaction();
				this.app.processTick();
				// console.log('process tick');
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
		console.group('syncing:  content');
		// console.group('syncing: content')
		const updatedNodeIds = this.changes.updated
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

		// console.log('publish', updatedNodes.map(n => n.id.toString()));

		updatedNodes
			.filter(n => updatedNodeIds.has(n.id))
			.forEach( n => this.publish(NodeChangeType.update, n));
		console.groupEnd()
	}

	//
	private updateNodeState() {
		const { selectedNodeIds, unselectedNodeIds, activatedNodeIds, deactivatedNodeIds, openNodeIds, closeNodeIds } = this.state;
		const dirtyNodesIds = new NodeIdSet();
		dirtyNodesIds.extend(
			selectedNodeIds,
			unselectedNodeIds,
			activatedNodeIds,
			deactivatedNodeIds,
			openNodeIds,
			closeNodeIds
		);

		const dirtyNodes = dirtyNodesIds.map(n => this.store.get(n)).filter(identity) as Node[];

		this.state.runtime.selectedNodeIds.clear();
		this.state.runtime.activatedNodeIds.clear();
		this.state.runtime.openNodeIds.clear();

		// console.log('publish', dirtyNodes.map(n => n.id.toString()), openNodeIds.size);

		each(dirtyNodes, n => this.publish(NodeChangeType.state, n));
	}

	private updateSelection(cb: Function) {
		if (!this.app.ready) {
			// console.log('app not ready');
			return
		}

		if (!this.isContentSynced) {
			throw new Error("Trying to sync selection with dirty content");
		}
		// this.app.enable();

		console.log('syncing selection', this.state.selection);
		console.group('syncing: selection');


		this.sm.syncSelection();
		this.app.emit(EventsOut.selectionUpdated, this.state.selection);
		cb();

		// process pending transactions
		this.tm.dispatch();
		console.groupEnd();
	}

}
