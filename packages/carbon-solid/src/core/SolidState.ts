import {ActionOrigin, Draft, IDENTITY_SCOPE, Node, NodeIdSet, PinnedSelection, State} from "@emrgen/carbon-core";
import {SolidNodeMap} from "./NodeMap";
import {SolidDraft} from "./SolidDraft";
import {StateChanges} from "@emrgen/carbon-core/src/core/NodeChange";

export class SolidState implements State {
  scope: Symbol;
  updated: NodeIdSet;
  content: Node;
  nodeMap: SolidNodeMap;
  selection: PinnedSelection;
  changes: StateChanges;

  isContentChanged: boolean;
  isSelectionChanged: boolean;

  constructor(content: Node, selection: PinnedSelection) {
    this.scope = IDENTITY_SCOPE;
    this.content = content;
    this.selection = selection;
    this.nodeMap = new SolidNodeMap();
    this.updated = new NodeIdSet();
    this.changes = new StateChanges();

    this.isContentChanged = true;
    this.isSelectionChanged = true;
  }

  activate(): State {
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
