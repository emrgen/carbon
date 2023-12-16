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
import { isEmpty, sortBy, zip } from "lodash";
import BTree from 'sorted-btree';
import { NodeType } from "./NodeType";
import { NodeAttrs, NodeAttrsJSON } from "./NodeAttrs";
import { Point, PointAt } from "./Point";
import { NodeState, NodeStateJSON } from "./NodeState";
import { takeUpto } from "../utils/array";
import { ActionOrigin } from "@emrgen/carbon-core";

// NOTE: it is internal to the state and should not be used outside of it
// represents a draft of a state, used to prepare a new state before commit
export class CarbonStateDraft {
  origin: ActionOrigin;
  state: CarbonState;
  nodeMap: NodeMap;
  selection: PointedSelection;
  changes: StateChanges = new StateChanges();

  private drafting = true;

  constructor(state: CarbonState, origin: ActionOrigin) {
    this.origin = origin;
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
    const { state, changes } = this;
    this.selection.freeze();

    const nodeMap = this.nodeMap.isEmpty ? state.nodeMap : this.nodeMap;
    nodeMap.freeze();
    changes.freeze();
    nodeMap.freeze();

    // create a new selection based on the new node map using the draft selection
    const selection = ((selection: PointedSelection) => {
      if (this.changes.selected.size) {
        const nodes = this.changes.selected.nodes(this.nodeMap);
        if (nodes.length !== this.changes.selected.size) {
          throw new Error("Cannot commit draft with invalid selection");
        }

        return PinnedSelection.fromNodes(nodes, );
      }
      const ret = selection.pin(this.nodeMap);
      if (!ret) {
        throw new Error("Cannot commit draft with invalid selection");
      }

      return ret;
    })(this.selection);


    const content = this.nodeMap.get(this.state.content.id)
    if (!content) {
      throw new Error("Cannot commit draft with invalid content");
    }

    const newState = new CarbonState({
      previous: state.clone(depth - 1),
      scope: state.scope,
      content,
      selection: selection.eq(state.selection) ? state.selection : selection,
      nodeMap,
      changes,
    });

    return newState.freeze();
  }

  // prepare the draft for commit
  prepare() {
    if (!this.drafting) {
      throw new Error("Cannot prepare a draft that is already committed");
    }

    // remove deleted nodes from changed list
    // this will prevent from trying to render deleted nodes
    this.changes.deleted.forEach(id => {
      this.changes.changed.remove(id);
    });

    const changed: NodeDepthEntry[] = this.changes.changed.toArray().map(id => {
      const node = this.nodeMap.get(id)!;
      const depth = this.nodeMap.parents(node).length;
      return {
        node,
        depth
      }
    });

    // console.log('prepare', changed.length, changed.map(n => n.node.id.toString()));
    // nodes with truthy states need to be added to the new state list
    this.state.changes.state.nodes(this.state.nodeMap).filter(n => {
      return !isEmpty(n.state.normalize())
    }).forEach(n => {
      this.changes.state.add(n.id)
    });

    // update state changes to reflect the new state
    this.changes.state.nodes(this.nodeMap).forEach(n => {
      console.log('state change', n.id.toString(), n.name, n.state.normalize());
      const state = n.state.normalize();
      if (state.activated) {
        this.changes.activated.add(n.id);
      }
      if (state.selected) {
        this.changes.selected.add(n.id);
      }
      if (state.opened) {
        this.changes.opened.add(n.id);
      }
    })

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
          clone.children.forEach(n => {
            n.freeze();
          })
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

  updateContent(nodeId: NodeId, content: NodeContent) {
    if (!this.drafting) {
      throw new Error("Cannot update content on a draft that is already committed");
    }

    let isEmpty = false;
    this.mutable(nodeId, node => {
      isEmpty = node.isEmpty;
      node.children.forEach(child => {
        this.nodeMap.delete(child.id);
      });
      node.updateContent(content);
    });

    // if the content is/ws empty, we need to trigger parent render to render placeholder
    if (isEmpty) {
      const parents = this.nodeMap.parents(nodeId);
      takeUpto(parents, n => n.isContainerBlock).forEach(n => this.mutable(n.id))
    }

    console.log('inserting content', nodeId.toString(), content.size);
    content.children.forEach(child => {
      console.log(child.id.toString(), child.parentId?.toString(), child.frozen);
      this.nodeMap.set(child.id, child);
      // this.changes.changed.add(child.id);
    })

    // if (content.size === 0) {
    //   const parent = this.nodeMap.get(node.parentId!);
    //   this.changes.changed.add(parent!.id);
    // } else {
    // }

    this.changes.updated.add(nodeId);
  }

  move(to: Point, node: Node) {
    if (!this.drafting) {
      throw new Error("Cannot move node to a draft that is already committed");
    }

    if (node.frozen) {
      throw Error('cannot insert immutable node, it must be at least mutable at top level');
    }

    this.changes.moved.add(node.id);
    if (!this.get(node.id)) {
      throw Error('move node not found in state map')
    }

    const {parentId} = node;
    if (!parentId) {
      throw Error('move node does not have parent id')
    }

    const oldParent = this.get(parentId);
    if (!oldParent) {
      throw Error('move node does not have old parent')
    }

    this.changes.changed.add(parentId);
    this.mutable(parentId, parent => parent.remove(node));

    this.insert(to, node, 'move');
  }

  insert(at: Point, node: Node, type : 'create' | 'move' = 'create') {
    if (!this.drafting) {
      throw new Error("Cannot insert node to a draft that is already committed");
    }

    if (node.frozen) {
      throw Error('cannot insert immutable node, it must be at least mutable at top level');
    }

    if (type === 'create') {
      this.changes.inserted.add(node.id);
      console.log('children', node);
      node.forAll(n => {
        console.log('inserting node', n.id.toString(), n.name);
        this.nodeMap.set(n.id, n);
      });
    } else {
      this.changes.moved.add(node.id);
      this.nodeMap.set(node.id, node);
    }

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
    this.mutable(parentId, parent => parent.prepend(node));
    this.changes.render.add(parentId);
  }

  private append(parentId: NodeId, node: Node) {
    this.mutable(parentId, parent => parent.append(node));
    this.changes.render.add(parentId);
  }

  private insertBefore(refId: NodeId, node: Node) {
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
  }

  private insertAfter(refId: NodeId, node: Node) {
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
  }

  remove(node: Node) {
    if (!this.drafting) {
      throw new Error("Cannot remove node from a draft that is already committed");
    }

    if (node.frozen) {
      throw Error('cannot remove immutable node, it must be at least mutable at top level');
    }

    const target = this.nodeMap.get(node.id);
    if (!target) {
      throw new Error("Cannot remove node that does not exist");
    }

    const parentId = node.parentId;
    if (!parentId) {
      throw new Error("Cannot remove node that does not have a parent");
    }

    this.mutable(parentId, parent => {
      parent.remove(node);
      // NOTE: if the parent is empty, we need to trigger parent render to render placeholder
      if (parent.isEmpty && parent.parentId) {
        this.mutable(parent.parentId)
      }
    });

    node.forAll(n => {
      console.log('removing node', n.id.toString(), n.name);
      this.changes.deleted.add(n.id);
      this.changes.changed.remove(n.id);
    });
  }

  changeName(nodeId: NodeId, type: NodeType) {
    if (!this.drafting) {
      throw new Error("Cannot change name on a draft that is already committed");
    }

    this.mutable(nodeId, node => {
      node.changeType(type);

      if (node.isEmpty) {
        // force render of all descendants if the node is empty
        node.descendants().forEach(n => {
          this.mutable(n.id)
        });
      }
    });


    this.changes.renamed.add(nodeId);
  }

  updateAttrs(nodeId: NodeId, attrs: Partial<NodeAttrsJSON>) {
    if (!this.drafting) {
      throw new Error("Cannot change name on a draft that is already committed");
    }

    this.mutable(nodeId, node => {
      node.updateAttrs(attrs);
      if (node.isEmpty) {
        // force render of all descendants if the node is empty
        node.descendants().forEach(n => {
          this.mutable(n.id)
        });
      }
    });

    this.changes.attrs.add(nodeId);
  }

  updateState(nodeId: NodeId, state: NodeStateJSON) {
    if (!this.drafting) {
      throw new Error("Cannot change name on a draft that is already committed");
    }

    if (state.selected) {
      this.changes.selected.add(nodeId);
    }
    if (state.activated) {
      this.changes.activated.add(nodeId);
    }
    if (state.opened) {
      this.changes.opened.add(nodeId);
    }

    this.mutable(nodeId, node => {
      node.updateState(state)
      if (node.isEmpty) {
        // force render of all descendants if the node is empty
        node.descendants().forEach(n => {
          this.mutable(n.id)
        });
      }
    });

    this.changes.state.add(nodeId);
  }

  updateSelection(selection: PointedSelection) {
    if (!this.drafting) {
      throw new Error("Cannot update selection on a draft that is already committed");
    }

    this.selection = selection;
    this.changes.selection = selection;
  }

  // creates a mutable copy of a node and adds it to the draft changes
  private mutable(id: NodeId, fn?: (node: Node) => void) {
    const node = this.nodeMap.get(id);
    if (!node) {
      throw new Error("Cannot mutate node that does not exist");
    }

    const mutable = this.nodeMap.has(id) ? node : node.clone();
    fn?.(mutable);

    this.changes.changed.add(id);
    this.nodeMap.set(id, mutable);

    return mutable;
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
