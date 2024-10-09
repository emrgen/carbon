import {
  BlockSelection,
  Draft,
  IDENTITY_SCOPE,
  Node,
  NodeIdSet,
  PinnedSelection,
  ProduceOpts,
  State,
  StateActions,
} from "@emrgen/carbon-core";
import { MarkSet } from "@emrgen/carbon-core";
import { SolidNodeMap } from "./NodeMap";
import { SolidDraft } from "./SolidDraft";
import { StateChanges } from "@emrgen/carbon-core/src/core/NodeChange";
import { Optional } from "@emrgen/types";

export class SolidState implements State {
  scope: Symbol;
  updated: NodeIdSet;
  content: Node;
  nodeMap: SolidNodeMap;
  selection: PinnedSelection;
  blockSelection: BlockSelection;
  changes: StateChanges;
  actions: StateActions;
  marks: MarkSet = new MarkSet();
  previous: Optional<State> = null;

  isMarksChanged: boolean;
  isContentChanged: boolean;
  isSelectionChanged: boolean;

  static create(
    content: Node,
    selection: PinnedSelection,
    blockSelection: BlockSelection,
    nodeMap: SolidNodeMap = new SolidNodeMap(),
  ) {
    const state = new SolidState(content, selection, blockSelection, nodeMap);
    if (!nodeMap.size) {
      content.all((n) => {
        nodeMap.set(n.id, n);
        state.updated.add(n.id);
      });
    }

    return state;
  }

  constructor(
    content: Node,
    selection: PinnedSelection,
    blockSelection: BlockSelection,
    nodeMap: SolidNodeMap,
  ) {
    this.scope = IDENTITY_SCOPE;
    this.content = content;
    this.selection = selection;
    this.blockSelection = blockSelection;
    this.nodeMap = nodeMap;
    this.updated = new NodeIdSet();
    this.changes = new StateChanges();
    this.actions = new StateActions();

    this.isContentChanged = false;
    this.isSelectionChanged = false;
    this.isMarksChanged = false;
  }

  activate(): State {
    console.log("[activate state]");
    return this;
  }

  deactivate(): void {}

  produce(fn: (state: Draft) => void, opts: ProduceOpts): State {
    const { origin, type, schema } = opts;
    const draft = new SolidDraft(this, origin, type, schema, this.marks);
    return draft.produce(fn);
  }

  eq(state: State): boolean {
    return false;
  }
}
