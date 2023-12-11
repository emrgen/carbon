import { Optional } from "@emrgen/types";
import { CarbonState } from "./CarbonState";
import { Node } from "./Node";
import { StateChanges } from "./NodeChange";
import { NodeId } from "./NodeId";
import { NodeMap } from "./NodeMap";
import { PinnedSelection } from "./PinnedSelection";

export class CarbonStateDraft {
  state: CarbonState;
  nodeMap: NodeMap;
  selection: PinnedSelection;
  changes: StateChanges = new StateChanges();

  private drafting = true;

  constructor(state: CarbonState) {
    this.state = state;
    this.nodeMap = NodeMap.from(state.nodeMap);
    this.selection = state.selection
  }

  get(id: NodeId): Optional<Node> {
    return this.nodeMap.get(id);
  }

  // turn the draft into a new state
  commit() {
    const { state, selection, changes, nodeMap} = this;
    selection.freeze();
    changes.freeze();
    nodeMap.freeze();

    return new CarbonState({
      previous: state,
      scope: state.scope,
      store: state.store,
      content: state.content,
      runtime: state.runtime,
      selection,
      nodeMap,
      changes,
    });
  }

  // prepare the draft for commit
  prepare() {
    return this;
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

  addPendingSelection(selection: PinnedSelection) {
    if (!this.drafting) {
      throw new Error("Cannot add pending selection to a draft that is already committed");
    }
    this.changes.pendingSelections.push(selection);
  }

  updateSelection(selection: PinnedSelection) {
    if (!this.drafting) {
      throw new Error("Cannot update selection on a draft that is already committed");
    }
    this.selection = selection;
    this.changes.selection = selection;
  }

  dispose() {
    this.drafting = false;
  }
}
