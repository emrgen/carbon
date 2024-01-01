import {Optional} from "@emrgen/types";
import {NodeIdSet} from "./BSet";
import {PinnedSelection} from "./PinnedSelection";
import {PointedSelection} from "./PointedSelection";
import {
  BTreeNodeMap,
  Draft, Maps,
  Node,
  NodeBTree, NodeContentData,
  NodeData,
  NodeId, NodeIdComparator,
  NodeMap,
  NodePropsJson,
  Slice,
  State
} from "@emrgen/carbon-core";
import BTree from "sorted-btree";

enum ChangeType {
  rename = 'rename',
  insert = 'insert',
  text = 'text',
  remove = 'remove',
  update = 'update',
  link = 'link',
  content = 'content',
  selection = 'selection',
}

export interface Change {
  type: ChangeType;
}

export class NameChange implements Change {
  type = ChangeType.rename;

  constructor(readonly nodeId: NodeId, readonly before: string, readonly after: string) {
  }

  static create(nodeId: NodeId, before: string, after: string) {
    return new NameChange(nodeId, before, after);
  }
}

export class InsertChange implements Change {
  type = ChangeType.insert;

  constructor(readonly parentId: NodeId, readonly nodeId: NodeId, readonly offset: number) {
  }

  static create(parentId: NodeId, nodeId: NodeId, offset: number) {
    return new InsertChange(parentId, nodeId, offset);
  }
}

export class TextChange implements Change {
  type = ChangeType.text;

  constructor(readonly nodeId: NodeId, readonly offset: number, readonly text: string, readonly action: 'insert' | 'remove') {
  }

  static create(nodeId: NodeId, offset: number, text: string, action: 'insert' | 'remove') {
    return new TextChange(nodeId, offset, text, action);
  }
}

export class RemoveChange implements Change {
  type = ChangeType.remove;

  constructor(readonly parentId: NodeId, readonly nodeId: NodeId, readonly offset: number) {
  }

  static create(parentId: NodeId, nodeId: NodeId, offset: number) {
    return new RemoveChange(parentId, nodeId, offset);
  }
}

// only record the changes not all the props
export class UpdateChange implements Change {
  type = ChangeType.update;

  constructor(readonly nodeId: NodeId, readonly before: NodePropsJson, readonly after: NodePropsJson) {
  }

  static create(nodeId: NodeId, before: NodePropsJson, after: NodePropsJson) {
    return new UpdateChange(nodeId, before, after);
  }
}

export class SetContentChange implements Change {
  type = ChangeType.content;

  constructor(readonly nodeId: NodeId, readonly before: NodeId[] | string, readonly after: NodeId[] | string) {
  }

  static create(nodeId: NodeId, before: NodeId[] | string, after: NodeId[] | string) {
    return new SetContentChange(nodeId, before, after);
  }
}

export class LinkChange implements Change {
  type = ChangeType.link;

  constructor(readonly nodeId: NodeId, readonly before: Optional<NodeId>, readonly after: Optional<NodeId>) {
  }

  static create(nodeId: NodeId, before: Optional<NodeId>, after: Optional<NodeId>) {
    return new LinkChange(nodeId, before, after);
  }
}

export class SelectionChange implements Change {
  type = ChangeType.selection;

  constructor(readonly before: PointedSelection, readonly after: PointedSelection) {
  }

  static create(before: PointedSelection, after: PointedSelection) {
    return new SelectionChange(before, after);
  }
}

// captures the changes in the state
// this can be used to rollback or to update the UI
export class StateChanges {
  // this nodes will be rendered
  // changed nodes will be rebuilt in the next render cycle
  patch: Change[] = [];

  // stores the nodes that are changed
  dataMap: NodeDataMap = NodeDataMap.empty()

  static empty() {
    return new StateChanges();
  }

  apply(state: Draft) {
  }

  // apply the changes to the state in reverse order
  rollback(state: Draft) {
  }

  inverse(): StateChanges {
    const {patch, dataMap} = this;
    const inverse = new StateChanges();

    for (let i = patch.length - 1; i >= 0; i--) {
      const change = patch[i];
      this.match(change, {
        rename(change: NameChange) {
          inverse.add(NameChange.create(change.nodeId, change.after, change.before));
        },
        insert(change: InsertChange) {
          inverse.add(RemoveChange.create(change.parentId, change.nodeId, change.offset));
        },
        text(change: TextChange) {
          if (change.action === 'insert') {
            inverse.add(TextChange.create(change.nodeId, change.offset, change.text, 'remove'));
          } else {
            inverse.add(TextChange.create(change.nodeId, change.offset, change.text, 'insert'));
          }
        },
        remove(change: RemoveChange) {
          inverse.add(InsertChange.create(change.parentId, change.nodeId, change.offset));
        },
        update(change: UpdateChange) {
          inverse.add(UpdateChange.create(change.nodeId, change.after, change.before));
        },
        link(change: LinkChange) {
          inverse.add(LinkChange.create(change.nodeId, change.after, change.before));
        },
        content(change: SetContentChange) {
          inverse.add(SetContentChange.create(change.nodeId, change.after, change.before));
        },
        selection(change: SelectionChange) {
          inverse.add(SelectionChange.create(change.after, change.before));
        }
      })
    }

    dataMap.forEach((data, nodeId) => {
      inverse.dataMap.set(nodeId, data);
    })

    return inverse;
  }

  match(change: Change, matcher: ChangeMatcher) {
    switch (change.type) {
      case ChangeType.rename:
        return matcher.rename(change as NameChange);
      case ChangeType.insert:
        return matcher.insert(change as InsertChange);
      case ChangeType.text:
        return matcher.text(change as TextChange);
      case ChangeType.remove:
        return matcher.remove(change as RemoveChange);
      case ChangeType.update:
        return matcher.update(change as UpdateChange);
      case ChangeType.link:
        return matcher.link(change as LinkChange);
      case ChangeType.content:
        return matcher.content(change as SetContentChange);
      case ChangeType.selection:
        return matcher.selection(change as SelectionChange);
    }
  }

  add(change: Change) {
    this.patch.push(change);
  }

  get isContentDirty() {
    return this.patch.some(c => c.type !== ChangeType.selection);
  }

  get isSelectionDirty() {
    return this.patch.some(c => c.type === ChangeType.selection);
  }

  freeze() {
    Object.freeze(this);
    return this;
  }

  toJSON() {
    return {}
  }

}

interface ChangeMatcher {
  rename(change: NameChange): void;

  insert(change: InsertChange): void;

  text(change: TextChange): void;

  remove(change: RemoveChange): void;

  update(change: UpdateChange): void;

  link(change: LinkChange): void;

  content(change: SetContentChange): void;

  selection(change: SelectionChange): void;
}

type NodeDataSelf = Omit<NodeData, 'children'>;

export class NodeDataMap extends BTree<NodeId, NodeDataSelf> {
  static empty() {
    return new NodeDataMap(undefined, NodeIdComparator);
  }
}
