import { Optional } from "@emrgen/types";
import { NodeIdSet } from "./BSet";
import { PinnedSelection } from "./PinnedSelection";
import { PointedSelection } from "./PointedSelection";
import {BTreeNodeMap, Draft, NodeBTree, NodeId, NodeMap, NodePropsJson, Slice, State} from "@emrgen/carbon-core";

enum ChangeType {
  insert = 'insert',
  remove = 'remove',
  update = 'update',
  setContent = 'setContent',
  selection = 'selection',
}

export interface Change {
  type: ChangeType;
}

class InsertChange implements Change {
  type = ChangeType.insert;
  constructor(readonly parentId: NodeId, readonly nodeId: NodeId, readonly offset: number) {}
}

class RemoveChange implements Change {
  type = ChangeType.remove;
  constructor(readonly parentId: NodeId, readonly nodeId: NodeId, readonly offset: number) {}
}

class UpdateChange implements Change {
  type = ChangeType.update;
  constructor(readonly nodeId: NodeId, readonly props: NodePropsJson) {}
}

class SetContentChange implements Change {
  type = ChangeType.setContent;
  constructor(readonly content: NodeId[] | string) {}
}

class SelectionChange implements Change {
  type = ChangeType.selection;
  constructor(readonly selection: PointedSelection) {}
}

// captures the changes in the state
// this can be used to rollback or to update the UI
export class StateChanges {
  // this nodes will be rendered
  // changed nodes will be rebuilt in the next render cycle
  changes: Change[] = [];

  nodeMap: NodeMap = BTreeNodeMap.empty();

  apply(state: Draft) {

  }

  add(change: Change) {
    this.changes.push(change);
  }

  get isContentDirty() {
    return this.changes.some(c => c.type !== ChangeType.selection);
  }

  get isSelectionDirty() {
    return this.changes.some(c => c.type === ChangeType.selection);
  }

  freeze() {
    Object.freeze(this);
    return this;
  }

  toJSON() {
    return {}
  }

}
