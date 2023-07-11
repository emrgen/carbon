import { each, identity } from 'lodash';
import { NodeIdSet } from './BSet';
import { CarbonState } from './CarbonState';
import { Carbon } from './Carbon';
import { Node } from "./Node";
import { NodeTopicEmitter } from './NodeEmitter';
import { SelectionManager } from './SelectionManager';
import { TransactionManager } from './TransactionManager';
import { EventsOut } from './Event';

export enum NodeChangeType {
	update = 'update',
	state = 'state',
}

/**
 * Syncs the editor state (iow content and selection) with the UI
 */
export class ChangeManager extends NodeTopicEmitter<NodeChangeType> {

	constructor(
		private readonly app: Carbon,
		private readonly state: CarbonState,
		private readonly sm: SelectionManager,
		private readonly tm: TransactionManager
	) {
		super();
	}

	private get store() {
		return this.state.store;
	}

	private get isContentSynced() {
		return !this.state.runtime.updatedNodeIds.size;
	}

	private get isStateSynced() {
		return !this.state.runtime.isNodeStateDirty
	}

	// 1. sync the doc
	// 2. sync the selection
	// 3. sync the node state
	update() {
		if (this.state.isContentDirty) {
			this.updateContent();
			// console.log('updating content');
			if (this.state.isNodeStateDirty) {
				// console.log('updating states');
				this.updateNodeState();
			}
			return
		}

		if (this.state.isNodeStateDirty) {
			// console.log('updating states');
			this.updateNodeState();
			return
		}

		if (this.state.isSelectionDirty) {
			// console.log('updating selection');
			this.updateSelection()
			return
		}
	}

	mounted(node: Node, changeType: NodeChangeType) {
		if (changeType === NodeChangeType.update) {
			this.state.runtime.updatedNodeIds.remove(node.id);
		}

		if (changeType === NodeChangeType.state) {
			console.log('mounted', node.id.toString());

		// 	this.state.runtime.selectedNodeIds.remove(node.id);
		// 	this.state.runtime.activatedNodeIds.remove(node.id);
		// 	this.state.runtime.openNodeIds.remove(node.id);
		}

		// console.log('mounted', this.isContentSynced, this.state.isSelectionDirty);
		if (this.isContentSynced) {
			this.app.emit(EventsOut.contentUpdated, this.state.content);
		}

		if (this.isStateSynced) {
			this.app.emit(EventsOut.nodeStateUpdated, this.state);
		}

		// console.log('--------', this.isContentSynced, this.isStateSynced, this.state.isSelectionDirty);
		if (this.isContentSynced) {
			// NOTE: if the last transaction did not update the selection, we can go ahead and process the next tick
			if (this.state.isSelectionDirty) {
				this.updateSelection();
			} else {
				this.app.processTick();
			}
		}
	}

	private updateContent() {
		console.group('syncing:  content');
		// console.group('syncing: content')
		const { updatedNodeIds } = this.state.runtime;
		const updatedNodes = updatedNodeIds.map(n => this.store.get(n)).filter(identity) as Node[];

		// remove nodes if ancestor is present in the updateNodes
		// this is needed to avoid updating the same node twice
		updatedNodes.forEach(n => {
			updatedNodeIds.remove(n.id);
			if (n.closest(p => updatedNodeIds.has(p.id))) {
				this.state.runtime.updatedNodeIds.remove(n.id);
				return
			}
			updatedNodeIds.add(n.id);
		})

		console.log('publish', updatedNodes.map(n => n.id.toString()));
		each(updatedNodes, n => this.publish(NodeChangeType.update, n));
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

		console.log('publish', dirtyNodes.map(n => n.id.toString()), openNodeIds.size);

		each(dirtyNodes, n => this.publish(NodeChangeType.state, n));
	}

	private updateSelection() {
		if (!this.isContentSynced) {
			throw new Error("Trying to sync selection with dirty content");
			return
		}

		// this.app.enable();

		console.group('syncing: selection');
		this.sm.syncSelection();
		this.app.emit(EventsOut.selectionUpdated, this.state.selection);

		// process pending transactions
		this.tm.dispatch();
		console.groupEnd();
	}

}
