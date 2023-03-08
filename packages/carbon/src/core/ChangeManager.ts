import { each, identity } from 'lodash';
import { NodeIdSet } from './BSet';
import { CarbonState } from './CarbonState';
import { Node } from "./Node";
import { NodeTopicEmitter } from './NodeEmitter';
import { SelectionManager } from './SelectionManager';
import { TransactionManager } from './TransactionManager';

export enum NodeChangeType {
	update = 'update',
	state = 'state',
}

// syncs ui with the editor state
export class ChangeManager extends NodeTopicEmitter<NodeChangeType> {

	constructor(readonly state: CarbonState, readonly sm: SelectionManager, readonly tm: TransactionManager) {
		super()
	}

	private get store() {
		return this.state.store;
	}

	private get isContentSynced() {
		return !this.state.runtime.updatedNodeIds.size;
	}

	// 1. sync the doc
	// 2. sync the selection
	// 3. sync the node state
	update() {
		if (this.state.isContentDirty) {
			this.updateContent();
			// console.log('update content');
			return
		}

		if (this.state.isNodeStateDirty) {
			// console.log('update node states');
			this.updateNodeState();
			return
		}

		if (this.state.isSelectionDirty) {
			this.updateSelection()
			// console.log('update selection');
			return
		}
	}

	mounted(node: Node) {
		this.state.runtime.updatedNodeIds.remove(node.id);
		if (this.isContentSynced && this.state.isSelectionDirty) {
			this.updateSelection();
		}
	}


	private updateContent() {
		console.group('syncing:  content');
		// console.group('syncing: content')
		const { updatedNodeIds } = this.state.runtime;
		const updatedNodes = updatedNodeIds.map(n => this.store.get(n)).filter(identity) as Node[];

		// find remove nodes if ancestor is present in the updateNodes
		updatedNodes.forEach(n => {
			updatedNodeIds.remove(n.id);
			if (n.closest(p => updatedNodeIds.has(p.id))) {
				this.state.runtime.updatedNodeIds.remove(n.id);
				return
			}
			updatedNodeIds.add(n.id);
		})

		console.log(updatedNodes);
		
		each(updatedNodes, n => this.publish(NodeChangeType.update, n));
		console.groupEnd()
	}

	// 
	private updateNodeState() {
		const { selectedNodeIds, unselectedNodeIds, activatedNodeIds, deactivatedNodeIds } = this.state;
		const dirtyNodesIds = new NodeIdSet();
		dirtyNodesIds.extend(selectedNodeIds, unselectedNodeIds, activatedNodeIds, deactivatedNodeIds);
		const dirtyNodes = dirtyNodesIds.map(n => this.store.get(n)).filter(identity) as Node[];

		this.state.runtime.selectedNodeIds.clear();
		this.state.runtime.activatedNodeIds.clear();

		each(dirtyNodes, n => this.publish(NodeChangeType.state, n));
	}

	private updateSelection() {
		if (!this.isContentSynced) {
			throw new Error("Trying to sync selection with dirty content");
			return
		}
		// if (this.state.runtime.selectedNodeIds.size) {
		// 	this.updateNodeState()
		// }
		console.group('syncing: selection');
		this.sm.syncSelection();
		this.tm.dispatch();
		console.groupEnd();
	}

}
