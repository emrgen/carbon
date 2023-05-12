import { Optional } from '@emrgen/types';
import { each, last } from 'lodash';
import { BSet, NodeIdSet } from './BSet';
import { ActionOrigin } from './actions/types';
import { DecorationStore } from './DecorationStore';
import { Node } from './Node';
import { NodeId } from './NodeId';
import { NodeStore } from './NodeStore';
import { PinnedSelection } from './PinnedSelection';
import { SelectionEvent } from './SelectionEvent';

export class CarbonRuntimeState {
	// pending
	selectEvents: SelectionEvent[] = [];
	// content updated node ids
	updatedNodeIds: NodeIdSet = new NodeIdSet();
	// selected node ids
	selectedNodeIds: NodeIdSet = new NodeIdSet();
	// activated node ids
	activatedNodeIds: NodeIdSet = new NodeIdSet();
	// deleted node ids
	deletedNodeIds: NodeIdSet = new NodeIdSet();
	// activeMarks: string = '';
	origin: ActionOrigin = ActionOrigin.Unknown;

	get isDirty() {
		return this.updatedNodeIds.size;
	}

	get selectEvent(): Optional<SelectionEvent> {
		return last(this.selectEvents)
	}

	addSelectEvent(event: SelectionEvent) {
		this.selectEvents.push(event);
	}
}


interface CarbonStateProps {
	content: Node;
	selection: PinnedSelection;
	store: NodeStore;

	decorations?: DecorationStore;
	selectedNodeIds?: NodeIdSet;
	activatedNodeIds?: NodeIdSet;
	runtime?: CarbonRuntimeState
}


export class CarbonState {
	decorations: DecorationStore;
	runtime: CarbonRuntimeState;
	content: Node;
	selection: PinnedSelection;
	store: NodeStore;

	selectedNodeIds: NodeIdSet;
	unselectedNodeIds: NodeIdSet;
	activatedNodeIds: NodeIdSet;
	deactivatedNodeIds: NodeIdSet;

	prevSelection?: PinnedSelection;
	selectionOrigin: ActionOrigin = ActionOrigin.Unknown;
	selectionSynced: boolean;

	private dirty = false;

	get isDirty() {
		return this.dirty || true
	}

	get isContentDirty() {
		return this.runtime.isDirty || this.decorations.size;
	}

	get isSelectionDirty() {
		return !this.selectionSynced;
	}

	get isNodeStateDirty() {
		return this.runtime.selectedNodeIds.size || this.runtime.activatedNodeIds.size;
	}

	static create(store: NodeStore, content: Node, selection: PinnedSelection) {
		return new CarbonState({ store, content, selection })
	}

	constructor(props: CarbonStateProps) {
		const {
			store,
			content,
			selection,
			runtime = new CarbonRuntimeState(),
			decorations = new DecorationStore(),
			selectedNodeIds = new NodeIdSet(),
			activatedNodeIds = new NodeIdSet(),
		} = props;

		this.content = content;
		this.selection = selection;
		this.decorations = decorations;
		this.runtime = runtime;
		this.store = store;

		this.selectedNodeIds = selectedNodeIds;
		this.activatedNodeIds = activatedNodeIds;
		this.deactivatedNodeIds = new NodeIdSet();
		this.unselectedNodeIds = new NodeIdSet();

		this.dirty = false;
		this.selectionSynced = false;
	}


	init() {
		this.store.reset();
		this.content.forAll(n => {
			this.store.put(n);
			this.runtime.updatedNodeIds.add(n.id);
		});
	}

	markDirty() {
		this.dirty = true;
	}

	markClean() {
		this.dirty = false;
	}

	setContent(content: Node) {
		this.content = content;
		this.init();
	}

	updateSelection(after: PinnedSelection, origin: ActionOrigin, selectionSynced = false) {
		this.prevSelection = this.selection;
		this.selection = after;
		this.selectionOrigin = origin;
		this.selectionSynced = selectionSynced;
	}

	updateNodeState() {
		if (!this.runtime.activatedNodeIds.size && !this.runtime.selectedNodeIds.size) return
		const { store } = this;
		this.selectedNodeIds.clear();
		this.unselectedNodeIds.clear();
		this.deactivatedNodeIds.clear();
		this.activatedNodeIds.clear();

		this.runtime.selectedNodeIds.forEach(id => {
			if (store.get(id)?.isSelected) {
				this.selectedNodeIds.add(id);
			} else {
				this.unselectedNodeIds.add(id);
			}
		});
		
		this.runtime.activatedNodeIds.forEach(id => {
			if (store.get(id)?.isActive) {
				this.activatedNodeIds.add(id);
			} else {
				this.deactivatedNodeIds.add(id);
			}
		});
	}

	updateContent() {
		if (!this.content.isDirty) return
		const nodes: Node[] = [];
		this.content = this.content.view(nodes);
		// console.log('document id', this.content.childrenVersion)
		nodes.forEach(n => {
			// console.log('new node', n.id.toString(), n.childrenVersion)
			this.store.put(n);
		});
	}

	clone() {
		return CarbonState.create(this.store, this.content, this.selection);
	}
}
