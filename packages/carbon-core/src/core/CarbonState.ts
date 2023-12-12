import { Optional } from '@emrgen/types';
import { last, merge, cloneDeep } from 'lodash';
import { NodeIdSet } from './BSet';
import { ActionOrigin } from './actions/types';
import { DecorationStore } from './DecorationStore';
import { Node } from './Node';
import { PinnedSelection } from './PinnedSelection';
import { SelectionEvent } from './SelectionEvent';
import { BlockSelection } from './NodeSelection';
import { CarbonClipboard } from './CarbonClipboard';
import EventEmitter from 'events';
import { NodeMap } from './NodeMap';
import { StateChanges } from './NodeChange';
import { CarbonStateDraft } from './CarbonStateDraft';

export class CarbonRuntimeState extends EventEmitter {
	// pending
	selectEvents: SelectionEvent[] = [];
	// content updated node ids
	updatedNodeIds: NodeIdSet = new NodeIdSet();
	// cursor is hidden in these nodes
	hideCursorNodeIds: NodeIdSet = new NodeIdSet();
	// selected node ids
	selectedNodeIds: NodeIdSet = new NodeIdSet();
	// activated node ids
	activatedNodeIds: NodeIdSet = new NodeIdSet();
	// deleted node ids
	deletedNodeIds: NodeIdSet = new NodeIdSet();
	// open node id
	openNodeIds: NodeIdSet = new NodeIdSet();
	// activeMarks: string = '';
	origin: ActionOrigin = ActionOrigin.Unknown;

	clipboard: CarbonClipboard = CarbonClipboard.default();

	kvStore: Map<string, any> = new Map();

	marks: string[] = [];

	constructor() {
		super();
	}

	get isContentDirty() {
		return this.updatedNodeIds.size;
	}

	get isNodeStateDirty() {
		return this.selectedNodeIds.size || this.activatedNodeIds.size || this.openNodeIds.size;
	}

	get selectEvent(): Optional<SelectionEvent> {
		return last(this.selectEvents)
	}

	get(key: string) {
		return this.kvStore.get(key);
	}

	set(key: string, value: any) {
		const prev = this.kvStore.get(key);
		this.kvStore.set(key, merge(cloneDeep(prev), value));
	}

	addSelectEvent(event: SelectionEvent) {
		this.selectEvents.push(event);
	}
}


interface CarbonStateProps {
	scope: string;
	previous?: CarbonState;
	content: Node;
	selection: PinnedSelection;
	nodeMap: NodeMap;
	changes?: StateChanges;

	decorations?: DecorationStore;
	selectedNodeIds?: NodeIdSet;
	activatedNodeIds?: NodeIdSet;
	runtime?: CarbonRuntimeState
}


export class CarbonState extends EventEmitter {
	previous: Optional<CarbonState>;

	scope: string;
	content: Node;
	selection: PinnedSelection;
	nodeMap: NodeMap;

	decorations: DecorationStore;
	changes: StateChanges;
	runtime: CarbonRuntimeState;

	selectedNodeIds: NodeIdSet;
	unselectedNodeIds: NodeIdSet;
	activatedNodeIds: NodeIdSet;
	deactivatedNodeIds: NodeIdSet;

	openNodeIds: NodeIdSet
	closeNodeIds: NodeIdSet

	selectionOrigin: ActionOrigin = ActionOrigin.Unknown;

	private dirty = false;


	get isDirty() {
		return this.dirty || true
	}

	get isContentDirty() {
		return this.runtime.isContentDirty || this.decorations.size;
	}

	get isNodeStateDirty() {
		return this.runtime.selectedNodeIds.size || this.runtime.activatedNodeIds.size || this.runtime.openNodeIds.size;
	}

	get nodeSelection() {
		return new BlockSelection(this.nodeMap, this.selectedNodeIds);
	}

	static create(scope: string, content: Node, selection: PinnedSelection, nodeMap: NodeMap) {
		return new CarbonState({ content, selection, scope, nodeMap })
	}

	constructor(props: CarbonStateProps) {
		super();
		const {
			scope,
			previous,
			content,
			selection,
			nodeMap,
			changes = new StateChanges(),
			runtime = new CarbonRuntimeState(),
			decorations = new DecorationStore(),
			selectedNodeIds = new NodeIdSet(),
			activatedNodeIds = new NodeIdSet(),
		} = props;

		this.previous = previous;
		this.scope = scope;
		this.content = content;
		this.selection = selection;
		this.decorations = decorations;
		this.nodeMap = nodeMap;
		this.changes = changes;
		this.runtime = runtime;

		this.selectedNodeIds = selectedNodeIds;
		this.activatedNodeIds = activatedNodeIds;
		this.deactivatedNodeIds = new NodeIdSet();
		this.unselectedNodeIds = new NodeIdSet();
		this.openNodeIds = new NodeIdSet();
		this.closeNodeIds = new NodeIdSet();

		this.dirty = false;
		// this.isSelectionDirty = true;
	}

	get depth() {
		let depth = 0;
		let node: Optional<CarbonState> = this;
		while (node.previous) {
			depth++;
			node = node.previous;
		}
		return depth;
	}

	init() {
		// this.content.forAll(n => {
		// 	this.store.put(n);
		// 	this.runtime.updatedNodeIds.add(n.id);
		// });
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

	// updateSelection(after: PinnedSelection, origin: ActionOrigin, isSelectionDirty = true) {
	// 	this.selection = after;
	// 	this.selectionOrigin = origin;

	// 	// console.log('selection is dirty', isSelectionDirty);
	// 	// this.isSelectionDirty = isSelectionDirty;
	// 	this.emit('change:selection', this.selection, this.prevSelection, this.selectionOrigin);
	// }

	updateNodeState() {
		// if (!this.runtime.isNodeStateDirty) return
		// this.selectedNodeIds.clear();
		// this.unselectedNodeIds.clear();
		// this.deactivatedNodeIds.clear();
		// this.activatedNodeIds.clear();
		// this.activatedNodeIds.clear();
		// this.openNodeIds.clear();
		// this.closeNodeIds.clear();
		//
		// this.runtime.selectedNodeIds.forEach(id => {
		// 	if (store.get(id)?.isSelected) {
		// 		this.selectedNodeIds.add(id);
		// 	} else {
		// 		this.unselectedNodeIds.add(id);
		// 	}
		// });
		//
		// this.runtime.activatedNodeIds.forEach(id => {
		// 	if (store.get(id)?.isActive) {
		// 		this.activatedNodeIds.add(id);
		// 	} else {
		// 		this.deactivatedNodeIds.add(id);
		// 	}
		// });
		//
		// this.runtime.openNodeIds.forEach(id => {
		// 	if (store.get(id)?.isOpen) {
		// 		this.openNodeIds.add(id);
		// 	} else {
		// 		this.closeNodeIds.add(id);
		// 	}
		// });
		//
		// this.runtime.emit('change', this.runtime);
	}

	updateContent() {
		// if (!this.content.isDirty) return
		// const nodes: Node[] = [];
		// // this.content = this.content.view(nodes);
		// // console.log('document id', this.content.childrenVersion)
		// nodes.forEach(n => {
		// 	// console.log('new node', n.id.toString(), n.childrenVersion)
		// 	// this.store.put(n);
		// });
		//
		// this.emit('change:content', this.content);
	}

	clone(depth: number = 2) {
		if (depth === 0) return null
		const { scope, content, selection, changes, nodeMap } = this;
		if (!this.previous) {
			return new CarbonState({
				scope,
				content,
				selection,
				changes,
				nodeMap,
			})
		}

		const previous = this.previous.clone(depth - 1);
		return new CarbonState({
			scope,
			content,
			selection,
			changes,
			nodeMap,
			previous,
		})
	}

	produce(fn: (state: CarbonStateDraft) => void): CarbonState {
		const draft = new CarbonStateDraft(this);
		try {
			fn(draft);
			const state = draft.prepare().commit(4);
			draft.dispose();
			return state;
		} catch (e) {
			console.error(e);
			draft.dispose();
			return this;
		}
	}

	freeze() {
		// remove all explicit parent links and freeze
		this.changes.freeze();

		this.selectedNodeIds.freeze();
		this.unselectedNodeIds.freeze();
		this.activatedNodeIds.freeze();
		this.deactivatedNodeIds.freeze();
		this.openNodeIds.freeze();
		this.closeNodeIds.freeze();
		this.nodeMap.freeze();
		this.content.freeze();
		this.selection.freeze();

		Object.freeze(this);

		return this;
	}
}
