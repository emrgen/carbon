import {ActionOrigin, FocusedPlaceholderPath, NodeIdSet, PinnedSelection, SelectedPath} from "@emrgen/carbon-core";
import { Optional } from "@emrgen/types";
import FastPriorityQueue from "fastpriorityqueue";
import { identity } from "lodash";
import { Node } from "./Node";
import { NodeContent } from "./NodeContent";
import { NodeId } from "./NodeId";
import { NodeMap } from "./NodeMap";
import { EmptyPlaceholderPath, NodePropsJson, PlaceholderPath } from "./NodeProps";
import { NodeType } from "./NodeType";
import { Point, PointAt } from "./Point";
import { PointedSelection } from "./PointedSelection";
import { State } from "./State";

class NodeDepthPriorityQueue {
  private queue: FastPriorityQueue<NodeDepthEntry>;

  static from(nodes: Node[], order: "asc" | "desc" = "asc") {
    const comparator = order === "asc" ? NodeDepthComparator : (a: NodeDepthEntry, b: NodeDepthEntry) => NodeDepthComparator(b, a);
    const queue = new NodeDepthPriorityQueue(comparator);
    nodes.forEach(n => {
      const depth = n.parents.length;
      queue.add(n, depth);
    });
    return queue;
  }

  constructor(comparator: ((a: NodeDepthEntry, b: NodeDepthEntry) => boolean)) {
    this.queue = new FastPriorityQueue(comparator);
  }

  add(node: Node, depth: number) {
    this.queue.add({ node, depth });
  }

  pop() {
    return this.queue.poll();
  }

  isEmpty() {
    return this.queue.isEmpty();
  }

  get size() {
    return this.queue.size;
  }
}

// NOTE: it is internal to the state and actions. it should not be used outside of it.
//draft of a state is used to prepare a new state before commit
export class StateDraft {
  origin: ActionOrigin;
  state: State;
  nodeMap: NodeMap;
  selection: PointedSelection;
  changes: NodeIdSet; // tracks changed nodes
  contentChanges: NodeIdSet = NodeIdSet.empty(); // tracks nodes with content changes
  removed: NodeIdSet = NodeIdSet.empty(); // tracks removed nodes

  private drafting = true;

  constructor(state: State, origin: ActionOrigin) {
    this.origin = origin;
    this.state = state;
    this.nodeMap = NodeMap.from(state.nodeMap);
    this.changes = new NodeIdSet();
    this.selection = state.selection.unpin(origin);
  }

  get(id: NodeId): Optional<Node> {
    return this.nodeMap.get(id);
  }

  parent(from: NodeId | Node): Optional<Node> {
    return this.nodeMap.parent(from);
  }

  // turn the draft into a new state
  commit(depth: number): State {
    const { state, changes, selection } = this;

    const nodeMap = this.nodeMap.current.size === 0 ? state.nodeMap : this.nodeMap;
    const content = this.nodeMap.get(this.state.content.id);
    if (!content) {
      throw new Error("Cannot commit draft with invalid content");
    }

    // create a new selection based on the new node map using the draft selection
    const after = selection.pin(nodeMap);
    if (!after) {
      throw new Error("Cannot commit draft with invalid pinned selection");
    }

    changes.freeze();
    nodeMap.freeze();
    after.freeze();

    const newState = new State({
      previous: state.clone(depth - 1),
      scope: state.scope,
      content,
      selection: after,
      nodeMap,
      changes,
      counter: state.counter + 1
    });

    return newState.freeze();
  }

  // prepare the draft for commit
  // transaction updates the node map to reflect the changes
  // prepare will create a new node map and tree with all the changes applied
  prepare() {
    if (!this.drafting) {
      throw new Error("Cannot prepare a draft that is already committed");
    }

    // remove deleted nodes from changed list
    // this will prevent from trying to render deleted nodes
    this.changes.toArray().forEach(id => {
      if (this.nodeMap.deleted(id)) {
        this.changes.remove(id);
      }
    });

    const changed: Node[] = this.changes.toArray().map(id => this.nodeMap.get(id)).map(identity) as unknown as Node[];
    const queue = NodeDepthPriorityQueue.from(changed, "desc");
    const updateOrder = NodeDepthPriorityQueue.from(changed, "desc");


    // console.log('changed nodes',changed.map(n => `${n.node.name}: ${n.node.id.toString()}`));

    // collect all mutable nodes tree created in this draft
    const updatedNodes = this.nodeMap.current.clone();
    const visited = NodeIdSet.empty();
    // all nodes that are changed will be processed
    while (queue.size) {
      const { node, depth } = queue.pop()!;
      if (visited.has(node.id)) {
        continue;
      }
      visited.add(node.id);

      // console.log('processing node', node.name, node.id.toString(), depth);
      const parent = this.nodeMap.parent(node);
      if (parent) {
        queue.add(parent, depth - 1);
        updateOrder.add(parent, depth - 1);
      }
    }

    while (updateOrder.size) {
      const { node } = updateOrder.pop()!;
      if (!this.nodeMap.has(node.id)) {
        const clone = node.clone(n => {
          if (this.nodeMap.deleted(n.id)) {
            return null;
          } else {
            return this.nodeMap.get(n.id);
          }
        });
        this.nodeMap.set(node.id, clone);
      } else {
        const mutable = this.nodeMap.get(node.id)!;
        mutable.content = mutable.content.clone(n => {
          if (this.nodeMap.deleted(n.id)) {
            return null;
          } else {
            return this.nodeMap.get(n.id);
          }
        })
      }
    }

    // in this scope all nodes are mutable
    const dirtyContent = NodeMap.empty();
    this.contentChanges.toArray().map(id => this.nodeMap.get(id)).map(n => n).forEach((node) => {
      node!.chain.forEach(n => {
        dirtyContent.set(n.id, n);
      });
    });

    dirtyContent.forEach((id, node) => {
      node.contentVersion += 1;
    });

    return this;
  }

  updateContent(nodeId: NodeId, content: NodeContent) {
    if (!this.drafting) {
      throw new Error("Cannot update content on a draft that is already committed");
    }

    this.mutable(nodeId, node => {
      node.descendants().forEach(child => {
        // console.log('removing content child', child.id.toString());
        this.delete(child.id);
      })

      if (node.isTextBlock) {
        node.updateProps({
          [PlaceholderPath]: content.isEmpty ? this.nodeMap.parent(node)?.properties.get<string>(EmptyPlaceholderPath) ?? "" : ""
        });
      } else if (node.name === "text") {

      }
      // console.log(content);
      node.updateContent(content);
      console.log("updated content", node.textContent);

      node.descendants().forEach(child => {
        console.log('inserted content child', child.id.toString());
        this.nodeMap.set(child.id, child);
      })
    });
  }

  move(to: Point, node: Node) {
    if (!this.drafting) {
      throw new Error("Cannot move node to a draft that is already committed");
    }

    if (node.frozen) {
      throw Error("cannot insert immutable node, it must be at least mutable at top level");
    }

    if (!this.get(node.id)) {
      throw Error("move node not found in state map");
    }

    const { parentId } = node;
    if (!parentId) {
      throw Error("move node does not have parent id");
    }

    const oldParent = this.get(parentId);
    if (!oldParent) {
      throw Error("move node does not have old parent");
    }

    this.mutable(parentId, parent => {
      node.nextSiblings?.forEach(ch => this.mutable(ch.id));
      parent.remove(node);
    });

    this.insert(to, node, "move");
  }

  insert(at: Point, node: Node, type: "create" | "move" = "create") {
    if (!this.drafting) {
      throw new Error("Cannot insert node to a draft that is already committed");
    }

    if (node.frozen) {
      throw Error("cannot insert immutable node, it must be at least mutable at top level");
    }

    if (type === "create") {
      node.forAll(n => {
        console.log("inserting node", n.id.toString(), n.name);
        this.nodeMap.set(n.id, n);
      });
    } else {
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
    this.mutable(parentId, parent => {
      parent.children.forEach(ch => this.mutable(ch.id));
      parent.prepend(node);
      this.contentChanges.add(parent.id);
    });
  }

  private append(parentId: NodeId, node: Node) {
    this.mutable(parentId, parent => {
      parent.append(node);
      this.contentChanges.add(parent.id);
    });
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

    this.mutable(parentId, parent => {
      this.mutable(refNode.id);
      refNode.nextSiblings?.forEach(ch => this.mutable(ch.id));
      parent.insertBefore(refNode, node);
      this.contentChanges.add(parent.id);
    });
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

    this.mutable(parentId, parent => {
      refNode.nextSiblings?.forEach(ch => this.mutable(ch.id));
      parent.insertAfter(refNode, node);
      this.contentChanges.add(parent.id);
    });
  }

  remove(node: Node) {
    if (!this.drafting) {
      throw new Error("Cannot remove node from a draft that is already committed");
    }

    if (node.frozen) {
      throw Error("cannot remove immutable node, it must be at least mutable at top level");
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
      node.nextSiblings.forEach(ch => this.mutable(ch.id));
      parent.remove(node);
      this.contentChanges.add(parent.id);

      // if parent title is empty, set placeholder from parent
      if (parent.isTextBlock && parent.isEmpty) {
        const placeholder = this.nodeMap.parent(parent)?.properties.get<string>(EmptyPlaceholderPath) ?? "";
        parent.updateProps({
          [PlaceholderPath]: placeholder
        });

        // console.log(parent.properties.toKV());
      }
    });

    node.forAll(n => {
      this.delete(n.id);
    });
  }

  change(nodeId: NodeId, type: NodeType) {
    if (!this.drafting) {
      throw new Error("Cannot change name on a draft that is already committed");
    }


    this.mutable(nodeId, node => {
      node.changeType(type);
      node.nextSiblings?.forEach(ch => this.mutable(ch.id));

      if (node.isContainerBlock && node.firstChild?.isEmpty) {
        this.mutable(node.firstChild.id, child => {
          child.updateProps({
            [PlaceholderPath]: type.props.get<string>(EmptyPlaceholderPath) ?? ""
          });
        });
      }
    });
  }

  updateProps(nodeId: NodeId, props: Partial<NodePropsJson>) {
    if (!this.drafting) {
      throw new Error("Cannot change name on a draft that is already committed");
    }

    // console.log('before update props', this.nodeMap.get(nodeId)?.properties.toKV());

    this.mutable(nodeId, node => {
      node.updateProps(props);
    });

    // console.log('after update props', this.nodeMap.get(nodeId)?.properties.toKV());
  }

  updateSelection(selection: PointedSelection) {
    if (!this.drafting) {
      throw new Error("Cannot update selection on a draft that is already committed");
    }

    console.log("update selection", selection.isInline);
    this.selection = selection;

    // update selection nodes
    if (selection.isInline) {
      console.log('-------------------')
      // const old = NodeIdSet.fromIds(this.state.selection.nodes.map(n => n.id));
      // const after = selection.pin(this.nodeMap)!;
      // if (after) {
      //   const nids = after.blocks.map(n => n.id);
      //   const now = NodeIdSet.fromIds(nids);
      //   console.log(nids, after.nodes, after.head.node, after.tail.node)
      //
      //   this.selection = PointedSelection.create(selection.tail, selection.head, nids, selection.origin);
      //
      //   // find removed block selection
      //   old.diff(now).forEach(id => {
      //     this.mutable(id, node => {
      //       node.updateProps({
      //         [SelectedPath]: false
      //       });
      //     });
      //   })
      //
      //   // find new block selection
      //   now.diff(old).forEach(id => {
      //     this.mutable(id, node => {
      //       console.log('selected node', node.name, node.id.toString(), node.properties.toKV());
      //       node.updateProps({
      //         [SelectedPath]: true
      //       });
      //     });
      //   })
      // }
    }

    // update empty placeholder if needed
    if (this.state.selection.isInline && this.state.selection.isCollapsed) {
      if (!this.state.selection.isIdentity) {
        const {head} = this.state.selection.unpin();
        const node = this.nodeMap.get(head.nodeId);
        if (!node) {
          throw new Error("Cannot update selection on a draft that is already committed");
        }

        if (node.isEmpty) {
          this.mutable(head.nodeId, node => {
            const parent = this.nodeMap.parent(node);
            if (!parent) return;
            node.updateProps({
              [PlaceholderPath]: parent.properties.get<string>(EmptyPlaceholderPath) ?? ""
            });
          });
        }
      }
    }

    // update focus placeholder if needed
    if (selection.isCollapsed && selection.isInline && !selection.isIdentity) {
      const { head } = selection;
      const node = this.nodeMap.get(head.nodeId);
      if (!node) {
        throw new Error("Cannot update selection on a draft that is already committed");
      }

      if (node.isEmpty) {
        this.mutable(head.nodeId, node => {
          const parent = this.nodeMap.parent(node);
          if (!parent) return;
          node.updateProps({
            [PlaceholderPath]: parent.properties.get<string>(FocusedPlaceholderPath) ?? ""
          });
        });
      }
    }
  }

  // creates a mutable copy of a node and adds it to the draft changes
  private mutable(id: NodeId, fn?: (node: Node) => void) {
    const node = this.nodeMap.get(id);
    if (!node) {
      throw new Error("Cannot mutate node that does not exist");
    }

    const mutable = this.nodeMap.has(id) ? node : node.clone();
    fn?.(mutable);

    this.changes.add(id);
    this.nodeMap.set(id, mutable);

    return mutable;
  }

  private delete(id: NodeId) {
    this.nodeMap.delete(id);
    this.removed.add(id);
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
    return true;
  }

  if (!b.node.parentId) {
    return false;
  }

  if (a.depth === b.depth) {
    if (a.node.parentId === b.node.parentId) {
      return a.node.id.comp(b.node.id) < 0;
    } else if (a.node.parentId && b.node.parentId) {
      return a.node.parentId.comp(b.node.parentId) < 0;
    } else {
      return false;
    }
  }

  return a.depth < b.depth;
};
