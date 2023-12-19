import { Optional } from "@emrgen/types";
import { NodeIdSet } from "./BSet";
import { ActionOrigin } from "./actions/types";
import { DecorationStore } from "./DecorationStore";
import { Node } from "./Node";
import { PinnedSelection } from "./PinnedSelection";
import EventEmitter from "events";
import { NodeMap } from "./NodeMap";
import { CarbonStateDraft } from "./CarbonStateDraft";
import { StateScope } from "./StateScope";

interface CarbonStateProps {
	scope: Symbol;
	previous?: CarbonState;
	content: Node;
	selection: PinnedSelection;
	nodeMap: NodeMap;
	changes?: NodeIdSet;
	decorations?: DecorationStore;
	counter?: number;
}


export class CarbonState extends EventEmitter {
	previous: Optional<CarbonState>;
	scope: Symbol;
	content: Node;
	selection: PinnedSelection;
	nodeMap: NodeMap;
	decorations: DecorationStore;
	changes: NodeIdSet;
	selectionOrigin: ActionOrigin = ActionOrigin.Unknown;

	counter: number = 0;

	static create(scope: Symbol, content: Node, selection: PinnedSelection, nodeMap?: NodeMap) {
		const map = nodeMap ?? new NodeMap();
		const state = new CarbonState({ content, selection, scope, nodeMap: map, });
		if (!nodeMap) {
			content.forAll(n => {
				map.set(n.id, n)
				state.changes.add(n.id);
			});
		}

		return state;
	}

	constructor(props: CarbonStateProps) {
		super();
		const {
			scope,
			previous,
			content,
			selection,
			nodeMap,
			changes = NodeIdSet.empty(),
			decorations = new DecorationStore(),
			counter = 0
		} = props;

		this.previous = previous;
		this.scope = scope;
		this.content = content;
		this.selection = selection;
		this.decorations = decorations;
		this.nodeMap = nodeMap;
		this.changes = changes;
		this.counter = counter;
	}

	get isSelectionChanged() {
		const eq = this.previous?.selection.eq(this.selection);
		// console.log('isSelectionChanged', eq, this.selection.origin, this.selection.toString());
		return !(eq && this.selection.origin === ActionOrigin.DomSelectionChange);
	}

	get isContentChanged() {
		return !this.previous?.content.eq(this.content) || this.previous?.content.version !== this.content.version;
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
			StateScope.set(this.scope, draft.nodeMap)
			fn(draft);
			const state = draft.prepare().commit(4);
			StateScope.set(this.scope, this.nodeMap)

			draft.dispose();
			return state;
		} catch (e) {
			StateScope.set(this.scope, this.nodeMap);
			console.error(e);
			draft.dispose();
			return this;
		}
	}

	revert(steps = 1) {
		let oldState = this as CarbonState;
		while (steps > 0 && oldState.previous) {
			oldState = oldState.previous!;
			steps--;
		}

		const state = CarbonState.create(oldState.scope, oldState.content, oldState.selection, oldState.nodeMap);
		state.previous = oldState;

		return state.freeze();
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
