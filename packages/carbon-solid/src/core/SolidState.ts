import {ActionOrigin, BlockSelection,
  Draft,
  IDENTITY_SCOPE,
  Node,
  NodeIdSet,
  PinnedSelection,
  State
} from "@emrgen/carbon-core";
import {SolidNodeMap} from "./NodeMap";
import {SolidDraft} from "./SolidDraft";
import {StateChanges} from "@emrgen/carbon-core/src/core/NodeChange";

export class SolidState implements State {
  scope: Symbol;
  updated: NodeIdSet;
  content: Node;
  nodeMap: SolidNodeMap;
  selection: PinnedSelection;
  blockSelection: BlockSelection;
  changes: StateChanges;

  isContentChanged: boolean;
  isSelectionChanged: boolean;

  static create(content: Node, selection: PinnedSelection, blockSelection: BlockSelection, nodeMap: SolidNodeMap = new SolidNodeMap()) {
    const state = new SolidState(content, selection, blockSelection, nodeMap);
    if (!nodeMap.size) {
      content.all(n => {
        nodeMap.set(n.id, n);
        state.updated.add(n.id);
      });
    }

    return state;
  }

  constructor(content: Node, selection: PinnedSelection, blockSelection: BlockSelection, nodeMap: SolidNodeMap) {
    this.scope = IDENTITY_SCOPE;
    this.content = content;
    this.selection = selection;
    this.blockSelection = blockSelection;
    this.nodeMap = nodeMap;
    this.updated = new NodeIdSet();
    this.changes = new StateChanges();

    this.isContentChanged = false;
    this.isSelectionChanged = false;
  }

  activate(): State {
    console.log('[activate state]')
    return this
  }

  deactivate(): void {}

  produce(origin: ActionOrigin, fn: (state: Draft) => void): State {
    const draft = new SolidDraft(this);
    return draft.produce(fn);
  }

  eq(state: State): boolean {
    return false;
  }
}
