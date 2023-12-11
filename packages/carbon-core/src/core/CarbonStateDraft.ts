import { Optional } from "@emrgen/types";
import { CarbonState } from "./CarbonState";
import { Node } from "./Node";
import { StateChanges } from "./NodeChange";
import { NodeId } from "./NodeId";
import { NodeMap } from "./NodeMap";
import { PinnedSelection } from "./PinnedSelection";
import { NodeContent } from "./NodeContent";
import { SelectionEvent } from "./SelectionEvent";
import { PointedSelection } from "./PointedSelection";

export class CarbonStateDraft {
  state: CarbonState;
  nodeMap: NodeMap;
  selection: PointedSelection;
  changes: StateChanges = new StateChanges();

  private drafting = true;

  constructor(state: CarbonState) {
    this.state = state;
    this.nodeMap = NodeMap.from(state.nodeMap);
    this.selection = state.selection.unpin();
  }

  get(id: NodeId): Optional<Node> {
    return this.nodeMap.get(id);
  }

  // turn the draft into a new state
  commit(depth: number) {
    const { state, selection, changes, nodeMap} = this;
    selection.freeze();
    changes.freeze();
    nodeMap.freeze();

    const pinnedSelection = selection.pin(this.nodeMap);
    if (!pinnedSelection) {
      throw new Error("Cannot commit draft with invalid selection");
    }

    return new CarbonState({
      previous: state.clone(depth - 1),
      scope: state.scope,
      store: state.store,
      content: state.content,
      runtime: state.runtime,
      selection: pinnedSelection,
      nodeMap,
      changes,
    }).freeze();
  }

  // prepare the draft for commit
  prepare() {
    return this;
  }

  updateContent(node: Node, content: NodeContent) {
    if (!this.drafting) {
      throw new Error("Cannot update content on a draft that is already committed");
    }

    let parent: Optional<Node> = this.nodeMap.has(node.id) ? this.nodeMap.get(node.parentId!) : node.clone(true);
    if (!parent) {
      throw new Error("Cannot update content of a node that does not exist");
    }

    parent.updateContent(content);

    this.nodeMap.set(parent.id, parent);
    this.changes.updated.add(node.id);
  }

  prepend(parent: Node, node: Node) {
    if (!this.drafting) {
      throw new Error("Cannot insert node to a draft that is already committed");
    }
    this.changes.inserted.add(node.id);
    this.nodeMap.set(node.id, node);
  }

  append(parent: Node, node: Node) {
    if (!this.drafting) {
      throw new Error("Cannot insert node to a draft that is already committed");
    }
    console.log("append", parent, node);

    this.changes.inserted.add(node.id);
    this.nodeMap.set(node.id, node);
  }

  insertBefore(refNode: Node, node: Node) {
    if (!this.drafting) {
      throw new Error("Cannot insert node to a draft that is already committed");
    }
    this.changes.inserted.add(node.id);
    this.nodeMap.set(node.id, node);
  }

  insertAfter(refNode: Node, node: Node) {
    if (!this.drafting) {
      throw new Error("Cannot insert node to a draft that is already committed");
    }
    this.changes.inserted.add(node.id);
    this.nodeMap.set(node.id, node);
  }

  remove(node: Node) {
    if (!this.drafting) {
      throw new Error("Cannot remove node from a draft that is already committed");
    }
    this.changes.deleted.add(node.id);
    this.nodeMap.set(node.id, null);
  }

  updateSelection(selection: PointedSelection) {
    if (!this.drafting) {
      throw new Error("Cannot update selection on a draft that is already committed");
    }

    this.selection = selection;
    this.changes.selection = selection;
  }

  _addPendingSelection(selection: PinnedSelection) {
    if (!this.drafting) {
      throw new Error("Cannot add pending selection to a draft that is already committed");
    }
    this.changes.pendingSelections.push(selection);
  }

  dispose() {
    this.drafting = false;
  }
}
