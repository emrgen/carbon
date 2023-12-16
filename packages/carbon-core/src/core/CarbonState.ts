import { Optional } from '@emrgen/types';
import { NodeIdSet } from './BSet';
import { ActionOrigin } from './actions/types';
import { DecorationStore } from './DecorationStore';
import { Node } from './Node';
import { PinnedSelection } from './PinnedSelection';
import EventEmitter from 'events';
import { NodeMap } from './NodeMap';
import { StateChanges } from './NodeChange';
import { CarbonStateDraft } from './CarbonStateDraft';

interface CarbonStateProps {
	scope: Symbol;
	previous?: CarbonState;
	content: Node;
	selection: PinnedSelection;
	nodeMap: NodeMap;
	changes?: StateChanges;
	decorations?: DecorationStore;
	selectedNodeIds?: NodeIdSet;
	activatedNodeIds?: NodeIdSet;
}


export class CarbonState extends EventEmitter {
	previous: Optional<CarbonState>;
	scope: Symbol;
	content: Node;
	selection: PinnedSelection;
	nodeMap: NodeMap;
	decorations: DecorationStore;
	changes: StateChanges;
	selectionOrigin: ActionOrigin = ActionOrigin.Unknown;

	static create(scope: Symbol, content: Node, selection: PinnedSelection, nodeMap: NodeMap) {
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
			decorations = new DecorationStore(),
		} = props;

		this.previous = previous;
		this.scope = scope;
		this.content = content;
		this.selection = selection;
		this.decorations = decorations;
		this.nodeMap = nodeMap;
		this.changes = changes;
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

	setContent(content: Node) {
		this.content = content;
		this.init();
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

	// try to create a new state or fail and return the previous state
	produce(origin: ActionOrigin, fn: (state: CarbonStateDraft) => void): CarbonState {
		const draft = new CarbonStateDraft(this, origin);
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
		this.nodeMap.freeze();
		this.content.freeze();
		this.selection.freeze();

		Object.freeze(this);

		return this;
	}
}
