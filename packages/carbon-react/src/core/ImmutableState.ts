import {ActionOrigin, MarkSet, Node, NodeIdSet, PinnedSelection, State} from "@emrgen/carbon-core";
import {Optional} from "@emrgen/types";
import {Scope} from "./Scope";
import {ImmutableNodeMap} from "./ImmutableNodeMap";
import {ImmutableDraft} from "./ImmutableDraft";

interface StateProps {
  scope: Symbol;
  previous?: ImmutableState;
  content: Node;
  selection: PinnedSelection;
  marks?: MarkSet;
  nodeMap: ImmutableNodeMap;
  updated?: NodeIdSet;
  counter?: number;
}

export class ImmutableState implements State {
  private previous: Optional<ImmutableState>;
  scope: Symbol;
  content: Node;
  selection: PinnedSelection;
  nodeMap: ImmutableNodeMap;
  updated: NodeIdSet;
  changes: StateChanges

  static create(scope: Symbol, content: Node, selection: PinnedSelection, nodeMap: ImmutableNodeMap = new ImmutableNodeMap()) {
    const state = new ImmutableState({ content, selection, scope, nodeMap });
    if (!nodeMap.size) {
      content.all(n => {
        nodeMap.set(n.id, n)
        state.updated.add(n.id);
      });
    }

    return state;
  }

  constructor(props: StateProps) {
    const {
      scope,
      previous,
      content,
      selection,
      nodeMap,
      updated = NodeIdSet.empty(),
    } = props;

    this.previous = previous;
    this.scope = scope;
    this.content = content;
    this.selection = selection;
    this.nodeMap = nodeMap;
    this.updated = updated;
  }

  get isSelectionChanged() {
    const eq = this.previous?.selection.eq(this.selection);
    // console.log('isSelectionChanged', eq, this.selection.origin, this.selection.toString());
    return !(eq && this.selection.origin === ActionOrigin.DomSelectionChange);
  }

  get isContentChanged() {
    return !this.previous?.content.eq(this.content) || this.previous?.content.renderVersion !== this.content.renderVersion;
  }

  // get depth() {
  // 	let depth = 0;
  // 	let node: Optional<State> = this;
  // 	while (node.previous) {
  // 		depth++;
  // 		node = node.previous;
  // 	}
  // 	return depth;
  // }
  //
  // init() {
  // 	// this.content.forAll(n => {
  // 	// 	this.store.put(n);
  // 	// 	this.runtime.updatedNodeIds.add(n.id);
  // 	// });
  // }
  //
  // setContent(content: Node) {
  // 	this.content = content;
  // 	this.init();
  // }

  activate() {
    Scope.set(this.scope, this.nodeMap);
    return this;
  }

  deactivate() {
    Scope.delete(this.scope);
  }

  clone(depth: number = 2) {
    if (depth === 0) return null
    const { scope, content, selection, updated, nodeMap } = this;
    if (!this.previous) {
      return new ImmutableState({
        scope,
        content,
        selection,
        updated,
        nodeMap,
      })
    }

    const previous = this.previous.clone(depth - 1);
    return new ImmutableState({
      scope,
      content,
      selection,
      updated,
      nodeMap,
      previous,
    })
  }

  // try to create a new state or fail and return the previous state
  produce(origin: ActionOrigin, fn: (state: ImmutableDraft) => void): State {
    const draft = new ImmutableDraft(this, origin);
    return draft.produce(fn);
  }

  eq(other: State) {
    return this.content.eq(other.content) && this.selection.eq(other.selection);
  }

  revert(steps = 1) {
    let oldState = this as ImmutableState;
    while (steps > 0 && oldState.previous) {
      oldState = oldState.previous!;
      steps--;
    }

    // create a new state with the same scope and content as the old state but with the old state as previous
    const state = ImmutableState.create(oldState.scope, oldState.content, oldState.selection);
    state.previous = oldState.previous;

    return state.freeze();
  }

  freeze() {
    // remove all explicit parent links and freeze
    this.updated.freeze();
    // this.nodeMap.freeze();
    this.content.freeze();
    this.selection.freeze();

    Object.freeze(this);

    return this;
  }
}
