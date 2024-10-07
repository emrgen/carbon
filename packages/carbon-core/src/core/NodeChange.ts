import { Optional } from "@emrgen/types";
import { PointedSelection } from "./PointedSelection";
import BTree from "sorted-btree";
import { last, uniqBy } from "lodash";
import dayjs from "dayjs";
import { SetContentAction } from "./actions/index";
import { InsertNodeAction } from "./actions/index";
import { RemoveNodeAction } from "./actions/index";
import { CarbonAction } from "./actions/index";
import { TxType } from "./actions/index";
import { SelectAction } from "./actions/index";
import { UpdatePropsAction } from "./actions/index";
import { NodeId } from "./NodeId";
import { NodeIdComparator } from "./NodeId";
import { NodeIdSet } from "./BSet";
import { Path } from "./Node";
import { NodePropsJson } from "./NodeProps";
import { Draft } from "./Draft";
import { NodeData } from "./NodeContent";

const CONTENT_ACTIONS = [SetContentAction, InsertNodeAction, RemoveNodeAction];

export class StateActions {
  time: number = dayjs().unix();
  actions: CarbonAction[];
  type: TxType;

  static compress(actions: StateActions[]) {
    if (actions.length === 0) {
      return;
    }

    let stateAction = actions.pop()!;
    while (true) {
      const next = actions.pop();
      if (!next) {
        break;
      }

      const merged = stateAction.merge(next);

      if (merged) {
        stateAction = merged;
      } else {
        actions.push(next);
        break;
      }
    }

    actions.push(stateAction!);
  }

  constructor(actions: CarbonAction[] = [], type: TxType = TxType.TwoWay) {
    this.actions = actions;
    this.type = type;
  }

  static empty() {
    return new StateActions();
  }

  get selectionOnly() {
    return this.actions.every((a) => a instanceof SelectAction);
  }

  add(action: CarbonAction) {
    this.actions.push(action);
  }

  pop() {
    return this.actions.pop();
  }

  last() {
    return this.actions[this.actions.length - 1];
  }

  inverse(): StateActions {
    // split the actions into parts ending with a select action
    // reverse each part
    // reverse the parts
    // reverse the select action
    // reverse the whole thing

    // const actions = this.actions.slice();
    // console.log('actions', actions);
    //
    // const parts: CarbonAction[][] = [];
    // let part: CarbonAction[] = [];
    // for (let i = 0; i < actions.length; i++) {
    //   const action = actions[i];
    //   part.push(action);
    //   if (action instanceof SelectAction) {
    //     parts.push(part);
    //     part = [];
    //   }
    // }
    //
    // if (part.length > 0) {
    //   parts.push(part);
    // }
    //
    // const inverseActions = new StateActions([], this.type);
    // parts.reverse().forEach(part => {
    //   if (last(part) instanceof SelectAction) {
    //     const select = part.pop() as SelectAction;
    //     part.reverse().forEach(action => {
    //       inverseActions.add(action.inverse());
    //     })
    //     const inverse = select.inverse();
    //     inverseActions.add(inverse);
    //   } else {
    //     part.reverse().forEach(action => {
    //       inverseActions.add(action.inverse());
    //     })
    //   }
    // })
    //
    // console.log('inverseActions', inverseActions.actions)
    //
    // return inverseActions;

    const actions = this.actions.slice();
    if (last(this.actions) instanceof SelectAction) {
      const select = actions.pop() as SelectAction;
      const inverseActions = new StateActions(
        actions.reverse().map((a) => a.inverse(), this.type),
      );
      const inverse = select.inverse();
      inverseActions.add(inverse);

      return inverseActions;
    } else {
      return new StateActions(
        actions.reverse().map((a) => a.inverse()),
        this.type,
      );
    }
  }

  merge(
    other: StateActions,
    order: "prev" | "next" = "prev",
  ): Optional<StateActions> {
    if (this.type !== other.type) return null;

    // if both update content part is only set content and both have the same node id
    const selfActions = this.actions.filter((a) =>
      CONTENT_ACTIONS.includes(a.constructor as any),
    );
    const otherActions = other.actions.filter((a) =>
      CONTENT_ACTIONS.includes(a.constructor as any),
    );
    const selfSetContent = selfActions.every(
      (a) => a instanceof SetContentAction,
    );
    const otherSetContent = otherActions.every(
      (a) => a instanceof SetContentAction,
    );
    if (selfSetContent && otherSetContent) {
      const selfTarget = uniqBy(
        selfActions.map((a) => (a as SetContentAction).nodeId),
        (id) => id.toString(),
      );
      const otherTarget = uniqBy(
        otherActions.map((a) => (a as SetContentAction).nodeId),
        (id) => id.toString(),
      );
      if (
        selfTarget.length === 1 &&
        otherTarget.length === 1 &&
        selfTarget[0].eq(otherTarget[0])
      ) {
        console.log("merge content", selfTarget[0].toString());
        if (order === "prev") {
          // return new StateActions([...this.actions, ...other.actions], this.type);
        } else {
          // return new StateActions([...other.actions, ...this.actions], this.type);
        }
      }
    }

    return null;
  }

  oneWay() {
    this.type = TxType.OneWay;
    return this;
  }

  optimize(): StateActions {
    return this;
    // reduce prop updates
    const propActions: BTree<NodeId, UpdatePropsAction[]> = new BTree(
      undefined,
      NodeIdComparator,
    );
    const removedNodes: NodeIdSet = NodeIdSet.empty();

    this.actions.forEach((action) => {
      if (action instanceof UpdatePropsAction) {
        const nodeId = action.nodeId;
        let actions = propActions.get(nodeId);
        if (!actions) {
          actions = [];
          propActions.set(nodeId, actions);
        }
        actions.push(action);
      }

      if (action instanceof RemoveChange) {
        removedNodes.add(action.nodeId);
      }
    });

    const actions = this.actions.filter((action) => {
      if (action instanceof UpdatePropsAction) {
        return false;
      }

      return true;
    });

    removedNodes.forEach((nodeId) => {
      propActions.delete(nodeId);
    });

    // optimize prop updates
    propActions.forEach((propAction, nodeId) => {
      const optimized = propAction.reduce(
        (prev, curr) => {
          return {
            before: { ...prev.before, ...curr.before },
            after: { ...prev.after, ...curr.after },
          };
        },
        {
          before: {},
          after: {},
        },
      );

      actions.push(
        UpdatePropsAction.withBefore(nodeId, optimized.before, optimized.after),
      );
    });

    return new StateActions(actions, this.type);
  }
}

enum ChangeType {
  rename = "rename",
  insert = "insert",
  text = "text",
  remove = "remove",
  update = "update",
  link = "link",
  content = "content",
  selection = "selection",
}

// path based actions are called changes
// they are used to update the state
// they can also be used to update the UI
// once applied to the state they can be used to rollback
// they will be used to implement realtime collaboration
export interface Change {
  type: ChangeType;
}

export class NameChange implements Change {
  type = ChangeType.rename;

  constructor(
    readonly nodeId: NodeId,
    readonly before: string,
    readonly after: string,
  ) {}

  static create(nodeId: NodeId, before: string, after: string) {
    return new NameChange(nodeId, before, after);
  }
}

export class InsertChange implements Change {
  type = ChangeType.insert;

  constructor(
    readonly parentId: NodeId,
    readonly nodeId: NodeId,
    readonly path: Path,
  ) {}

  static create(parentId: NodeId, nodeId: NodeId, path: Path) {
    return new InsertChange(parentId, nodeId, path);
  }
}

export class TextChange implements Change {
  type = ChangeType.text;

  constructor(
    readonly nodeId: NodeId,
    readonly offset: number,
    readonly text: string,
    readonly action: "insert" | "remove",
  ) {}

  static create(
    nodeId: NodeId,
    offset: number,
    text: string,
    action: "insert" | "remove",
  ) {
    return new TextChange(nodeId, offset, text, action);
  }
}

export class RemoveChange implements Change {
  type = ChangeType.remove;

  constructor(
    readonly parentId: NodeId,
    readonly nodeId: NodeId,
    readonly path: Path,
  ) {}

  static create(parentId: NodeId, nodeId: NodeId, path: Path) {
    return new RemoveChange(parentId, nodeId, path);
  }
}

// only record the changes not all the props
export class UpdateChange implements Change {
  type = ChangeType.update;

  constructor(
    readonly nodeId: NodeId,
    readonly path: Path,
    readonly before: NodePropsJson,
    readonly after: NodePropsJson,
  ) {}

  static create(
    nodeId: NodeId,
    path: Path,
    before: NodePropsJson,
    after: NodePropsJson,
  ) {
    return new UpdateChange(nodeId, path, before, after);
  }
}

export class SetContentChange implements Change {
  type = ChangeType.content;

  constructor(
    readonly nodeId: NodeId,
    readonly path: Path,
    readonly before: NodeId[] | string,
    readonly after: NodeId[] | string,
  ) {}

  static create(
    nodeId: NodeId,
    path: Path,
    before: NodeId[] | string,
    after: NodeId[] | string,
  ) {
    return new SetContentChange(nodeId, path, before, after);
  }
}

export class LinkChange implements Change {
  type = ChangeType.link;

  constructor(
    readonly nodeId: NodeId,
    readonly before: Optional<NodeId>,
    readonly after: Optional<NodeId>,
  ) {}

  static create(
    nodeId: NodeId,
    before: Optional<NodeId>,
    after: Optional<NodeId>,
  ) {
    return new LinkChange(nodeId, before, after);
  }
}

export class SelectionChange implements Change {
  type = ChangeType.selection;

  constructor(
    readonly before: PointedSelection,
    readonly after: PointedSelection,
  ) {}

  static create(before: PointedSelection, after: PointedSelection) {
    return new SelectionChange(before, after);
  }
}

// captures the changes in the state
// this can be used to rollback or to update the UI
export class StateChanges {
  time: number = dayjs().unix();
  // this nodes will be rendered
  // changed nodes will be rebuilt in the next render cycle
  patch: Change[];

  // stores the nodes that are changed
  dataMap: NodeDataMap;

  static empty() {
    return new StateChanges();
  }

  constructor(
    patch: Change[] = [],
    dataMap: NodeDataMap = NodeDataMap.empty(),
  ) {
    this.patch = patch;
    this.dataMap = dataMap;
  }

  last() {
    return this.patch[this.patch.length - 1];
  }

  pop() {
    return this.patch.pop();
  }

  apply(state: Draft) {}

  // apply the changes to the state in reverse order
  rollback(state: Draft) {}

  inverse(): StateChanges {
    const { patch, dataMap } = this;
    const inverse = new StateChanges();

    for (let i = patch.length - 1; i >= 0; i--) {
      const change = patch[i];
      this.match(change, {
        rename(change: NameChange) {
          inverse.add(
            NameChange.create(change.nodeId, change.after, change.before),
          );
        },
        insert(change: InsertChange) {
          inverse.add(
            RemoveChange.create(change.parentId, change.nodeId, change.path),
          );
        },
        text(change: TextChange) {
          if (change.action === "insert") {
            inverse.add(
              TextChange.create(
                change.nodeId,
                change.offset,
                change.text,
                "remove",
              ),
            );
          } else {
            inverse.add(
              TextChange.create(
                change.nodeId,
                change.offset,
                change.text,
                "insert",
              ),
            );
          }
        },
        remove(change: RemoveChange) {
          inverse.add(
            InsertChange.create(change.parentId, change.nodeId, change.path),
          );
        },
        update(change: UpdateChange) {
          inverse.add(
            UpdateChange.create(
              change.nodeId,
              change.path,
              change.after,
              change.before,
            ),
          );
        },
        link(change: LinkChange) {
          inverse.add(
            LinkChange.create(change.nodeId, change.after, change.before),
          );
        },
        content(change: SetContentChange) {
          inverse.add(
            SetContentChange.create(
              change.nodeId,
              change.path,
              change.after,
              change.before,
            ),
          );
        },
        selection(change: SelectionChange) {
          inverse.add(SelectionChange.create(change.after, change.before));
        },
      });
    }

    dataMap.forEach((data, nodeId) => {
      inverse.dataMap.set(nodeId, data);
    });

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

  optimize(): StateChanges {
    return this;
  }

  get isContentDirty() {
    return this.patch.some((c) => c.type !== ChangeType.selection);
  }

  get isSelectionDirty() {
    return this.patch.some((c) => c.type === ChangeType.selection);
  }

  freeze() {
    Object.freeze(this);
    return this;
  }

  toJSON() {
    return {};
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

export class NodeDataMap extends BTree<NodeId, NodeData> {
  static empty() {
    return new NodeDataMap(undefined, NodeIdComparator);
  }
}

const tree =  new BTree(
  undefined,
  NodeIdComparator,
);