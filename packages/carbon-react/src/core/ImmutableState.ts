import {
  ActionOrigin,
  BlockSelection,
  MarkSet,
  Node,
  NodeIdSet,
  PinnedSelection,
  ProduceOpts,
  State,
  StateActions,
  StateChanges,
  StateScope,
} from "@emrgen/carbon-core";
import { Optional } from "@emrgen/types";
import { ImmutableDraft } from "./ImmutableDraft";
import { ImmutableNodeMap } from "./ImmutableNodeMap";

interface StateProps {
  scope: Symbol;
  previous?: ImmutableState;
  content: Node;
  selection: PinnedSelection;
  blockSelection?: BlockSelection;
  nodeMap: ImmutableNodeMap;
  updated?: NodeIdSet;
  contentUpdated?: NodeIdSet;
  changes?: StateChanges;
  actions?: StateActions;
  counter?: number;
  marks?: MarkSet;
}

export class ImmutableState implements State {
  previous: Optional<ImmutableState>;
  scope: Symbol;
  content: Node;
  selection: PinnedSelection;
  marks: MarkSet;
  blockSelection: BlockSelection;
  nodeMap: ImmutableNodeMap;
  updated: NodeIdSet;
  contentUpdated: NodeIdSet;
  changes: StateChanges;
  actions: StateActions;

  static create(
    scope: Symbol,
    content: Node,
    selection: PinnedSelection,
    nodeMap: ImmutableNodeMap = new ImmutableNodeMap(),
  ) {
    const state = new ImmutableState({ content, selection, scope, nodeMap });
    // NOTE: if the nodeMap is empty, fill it with the content nodes and mark them as updated
    // this is necessary to ensure to force a re-render of the content nodes
    // when the state is activated for the first time
    if (!nodeMap.size) {
      content.all((n) => {
        // console.info(n.id.toString());
        nodeMap.set(n.id, n);
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
      contentUpdated = NodeIdSet.empty(),
      changes = StateChanges.empty(),
      actions = StateActions.empty(),
      blockSelection = BlockSelection.empty(),
      marks = MarkSet.empty(),
    } = props;

    // scope and previous state
    this.scope = scope;
    this.previous = previous;

    // content and selection
    this.content = content;
    this.selection = selection;
    this.blockSelection = blockSelection;

    // keep track of which nodes have been updated
    this.nodeMap = nodeMap;
    this.updated = updated;
    this.contentUpdated = contentUpdated;

    // keep track of changes and actions that have been applied to the state
    this.changes = changes;
    this.actions = actions;
    this.marks = marks;
  }

  get isSelectionChanged() {
    const eq = this.previous?.selection.eq(this.selection);
    return !(eq && this.selection.origin === ActionOrigin.DomSelectionChange);
  }

  get isContentChanged() {
    return (
      !this.previous?.content.eq(this.content) ||
      this.previous?.content.renderVersion !== this.content.renderVersion
    );
  }

  get isMarksChanged() {
    return !this.previous?.marks.eq(this.marks);
  }

  activate() {
    StateScope.put(this.scope, this.nodeMap);
    StateScope.set(this.scope);
    return this;
  }

  deactivate() {
    StateScope.delete(this.scope);
  }

  clone(depth: number = 2) {
    if (depth === 0) return null;
    const { scope, content, selection, updated, nodeMap, marks } = this;
    if (!this.previous) {
      return new ImmutableState({
        scope,
        content,
        selection,
        updated,
        nodeMap,
        marks,
      });
    }

    const previous = this.previous.clone(depth - 1);
    return new ImmutableState({
      scope,
      content,
      selection,
      updated,
      nodeMap,
      previous,
      marks,
    });
  }

  // try to create a new state or fail and return the previous state
  produce(fn: (state: ImmutableDraft) => void, opts: ProduceOpts): State {
    const { origin, pm, schema, type } = opts;
    const { marks } = this;
    const draft = new ImmutableDraft(this, origin, type, pm, schema, marks);
    return draft.produce(fn);
  }

  eq(other: State) {
    if (this.scope !== other.scope) return false;
    return (
      this.content.renderVersion === other.content.renderVersion &&
      this.selection.eq(other.selection) &&
      this.marks.eq(other.marks)
    );
  }

  revert(steps = 1) {
    let oldState = this as ImmutableState;
    while (steps > 0 && oldState.previous) {
      oldState = oldState.previous!;
      steps--;
    }

    // create a new state with the same scope and content as the old state but with the old state as previous
    const state = ImmutableState.create(
      oldState.scope,
      oldState.content,
      oldState.selection,
    );
    state.previous = oldState.previous;

    return state.freeze();
  }

  freeze() {
    // remove all explicit parent links and freeze
    this.updated.freeze();
    this.nodeMap.freeze();
    // this.content.freeze(identity);
    this.selection.freeze();

    Object.freeze(this);

    return this;
  }
}
