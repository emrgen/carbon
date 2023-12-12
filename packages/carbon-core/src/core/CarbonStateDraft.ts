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
import { sortBy, zip } from 'lodash';
import BTree from 'sorted-btree';
import { NodeType } from "./NodeType";
import { NodeAttrs } from "./NodeAttrs";
import { Point, PointAt } from "./Point";

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

  parent(from: NodeId | Node): Optional<Node> {
    return this.nodeMap.parent(from);
  }

  // turn the draft into a new state
  commit(depth: number) {
    const { state, changes, nodeMap} = this;
    this.selection.freeze();
    changes.freeze();
    nodeMap.freeze();

    const selection = this.selection.pin(this.nodeMap);
    if (!selection) {
      throw new Error("Cannot commit draft with invalid selection");
    }

    const content = this.nodeMap.get(this.state.content.id)
    if (!content) {
      throw new Error("Cannot commit draft with invalid content");
    }

    const newState = new CarbonState({
      previous: state.clone(depth - 1),
      scope: state.scope,
      content,
      runtime: state.runtime,
      selection,
      nodeMap,
      changes,
    });

    return newState.freeze();
  }

  // prepare the draft for commit
  prepare() {
    const changed: NodeDepthEntry[] = this.changes.changed.toArray().map(id => {
      const node = this.nodeMap.get(id)!;
      const depth = this.nodeMap.parents(node).length;
      return {
        node,
        depth
      }
    });

    console.log('prepare', changed.length, changed.map(n => n.node.id.toString()));

    changed.sort(NodeDepthComparator);

    const process: Node[] = [];
    while (changed.length > 0) {
      // console.log('processing changes', changed.length);
      let prev = changed.shift()!;
      let next: Optional<NodeDepthEntry> = null;
      process.push(prev.node);
      // console.log('taking node', prev.node.id.toString(), prev.node.name, prev.depth);
      const depth = prev.depth;
      while (changed.length > 0 && changed[0].depth === prev.depth) {
        next = changed.shift()!;
        if (next.node.parentId && prev.node.parentId && !next.node.parentId.eq(prev.node.parentId)) {
          // console.log('taking node', next.node.id.toString(), next.node.name, next.depth);
          process.push(next.node);
          prev = next;
        }
      }

      while (process.length > 0) {
        const node = process.pop()!;
        // console.log('processing node', node.id.toString(), node.name);
        const parent = this.nodeMap.parent(node);
        if (parent) {
          const clone = parent.clone(n => {
            if (this.nodeMap.deleted(n.id)) {
              return null;
            } else {
              return this.nodeMap.get(n.id);
            }
          });
          this.nodeMap.set(parent.id, clone);
          changed.unshift({
            node: clone,
            depth: depth - 1
          });
        }
      }
    }

    return this;
  }

  private mutable(id: NodeId, fn: (node: Node) => void) {
    const node = this.nodeMap.get(id);
    if (!node) {
      throw new Error("Cannot mutate node that does not exist");
    }
    // console.log('mutable', );
    
    const mutable = this.nodeMap.has(id) ? node : node.clone();
    fn(mutable);
    this.nodeMap.set(id, mutable);

    return mutable;
  }

  updateContent(nodeId: NodeId, content: NodeContent) {
    if (!this.drafting) {
      throw new Error("Cannot update content on a draft that is already committed");
    }

    this.mutable(nodeId, node => {
      node.updateContent(content);
    });
    content.children.forEach(child => {
      this.nodeMap.set(child.id, child);
      // this.changes.changed.add(child.id);
    })

    // if (content.size === 0) {
    //   const parent = this.nodeMap.get(node.parentId!);
    //   this.changes.changed.add(parent!.id);
    // } else {
    // }

    this.changes.changed.add(nodeId);
    this.changes.updated.add(nodeId);
  }

  insert(at: Point, node: Node) {
    switch (at.at) {
      case PointAt.After:
        return this.insertAfter(at.nodeId, node);
      case PointAt.Before:
        return this.insertBefore(at.nodeId, node);
      case PointAt.Start:
        return this.prepend(at.nodeId, node);
      case PointAt.End:
        return this.append(at.nodeId, node);
    }

    throw new Error("Invalid insertion point");
  }

  private prepend(parentId: NodeId, node: Node) {
    if (!this.drafting) {
      throw new Error("Cannot insert node to a draft that is already committed");
    }

    this.mutable(parentId, parent => parent.prepend(node));

    this.changes.render.add(parentId);
    this.changes.changed.add(parentId);
    this.changes.inserted.add(node.id);
    this.nodeMap.set(node.id, node);
  }

  private append(parentId: NodeId, node: Node) {
    if (!this.drafting) {
      throw new Error("Cannot insert node to a draft that is already committed");
    }

    this.mutable(parentId, parent => parent.append(node));

    this.changes.render.add(parentId);
    this.changes.changed.add(parentId);
    this.changes.inserted.add(node.id);
    this.nodeMap.set(node.id, node);
  }

  private insertBefore(refId: NodeId, node: Node) {
    if (!this.drafting) {
      throw new Error("Cannot insert node to a draft that is already committed");
    }

    const refNode = this.nodeMap.get(refId);
    if (!refNode) {
      throw new Error("Cannot insert node before a node that does not exist");
    }

    const parentId = refNode.parentId;
    if (!parentId) {
      throw new Error("Cannot insert node before a node that does not have a parent");
    }

    const parent = this.nodeMap.get(parentId);
    if (!parent) {
      throw new Error("Cannot insert node before a node that does not have a parent");
    }

    this.mutable(parentId, parent => parent.insertBefore(refNode, node));

    this.changes.render.add(parentId);
    this.changes.changed.add(parentId);
    this.changes.inserted.add(node.id);
    this.nodeMap.set(node.id, node);
  }

  private insertAfter(refId: NodeId, node: Node) {
    if (!this.drafting) {
      throw new Error("Cannot insert node to a draft that is already committed");
    }

    const refNode = this.nodeMap.get(refId);
    if (!refNode) {
      throw new Error("Cannot insert node before a node that does not exist");
    }

    const parentId = refNode.parentId;
    if (!parentId) {
      throw new Error("Cannot insert node before a node that does not have a parent");
    }

    const parent = this.nodeMap.get(parentId);
    if (!parent) {
      throw new Error("Cannot insert node before a node that does not have a parent");
    }

    this.mutable(parentId, parent => parent.insertAfter(refNode, node));

    this.changes.render.add(parentId);
    this.changes.changed.add(parentId);
    node.forAll(n => {
      this.changes.changed.add(parentId);
      this.changes.inserted.add(n.id);
      this.nodeMap.set(n.id, n);
    });
  }

  remove(nodeId: NodeId) {
    if (!this.drafting) {
      throw new Error("Cannot remove node from a draft that is already committed");
    }

    const node = this.nodeMap.get(nodeId);
    if (!node) {
      throw new Error("Cannot remove node that does not exist");
    }

    const parentId = node.parentId;
    if (!parentId) {
      throw new Error("Cannot remove node that does not have a parent");
    }

    this.mutable(parentId, parent => parent.remove(node));

    this.changes.changed.add(parentId);
    this.changes.deleted.add(node.id);
    this.nodeMap.delete(node.id);
  }

  changeName(nodeId: NodeId, type: NodeType) {
    if (!this.drafting) {
      throw new Error("Cannot change name on a draft that is already committed");
    }

    this.mutable(nodeId, node => node.changeType(type));

    this.changes.changed.add(nodeId);
    this.changes.renamed.add(nodeId);
  }

  updateAttrs(nodeId: NodeId, attrs: Partial<NodeAttrs>) {
    if (!this.drafting) {
      throw new Error("Cannot change name on a draft that is already committed");
    }

    this.mutable(nodeId, node => node.updateAttrs(attrs));

    this.changes.changed.add(nodeId);
    this.changes.updated.add(nodeId);
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


interface NodeDepthEntry {
  node: Node;
  depth: number;
}

const NodeDepthComparator = (a: NodeDepthEntry, b: NodeDepthEntry) => {
  if (!a.node.parentId) {
    return -1;
  }

  if (!b.node.parentId) {
    return 1;
  }

  if (a.depth === b.depth) {
    if (a.node.parentId === b.node.parentId) {
      return a.node.id.comp(b.node.id);
    } else if (a.node.parentId && b.node.parentId) {
      return a.node.parentId.comp(b.node.parentId);
    } else {
      return 0;
    }
  }

  return a.depth - b.depth;
}
