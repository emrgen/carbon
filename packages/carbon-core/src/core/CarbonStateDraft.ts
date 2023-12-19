import { Optional } from "@emrgen/types";
import { CarbonState } from "./CarbonState";
import { Node } from "./Node";
import { StateChanges } from "./NodeChange";
import { NodeId } from "./NodeId";
import { NodeMap } from "./NodeMap";
import { PinnedSelection } from "./PinnedSelection";
import { NodeContent } from "./NodeContent";
import { PointedSelection } from "./PointedSelection";
import { NodeType } from "./NodeType";
import { Point, PointAt } from "./Point";
import {  NodeStateJSON } from "./NodeState";
import { ActionOrigin, FocusedPlaceholderPath, NodeIdSet, OpenedPath, RenderPath } from "@emrgen/carbon-core";
import { nodePlaceholder } from "../utils/attrs";
import {
  ActivatedPath,
  EmptyPlaceholderPath,
  NodeProps,
  NodePropsJson,
  PlaceholderPath,
  SelectedPath
} from "./NodeProps";
import { StateScope } from "./StateScope";

// NOTE: it is internal to the state and actions. it should not be used outside of it.
//draft of a state is used to prepare a new state before commit
export class CarbonStateDraft {
  origin: ActionOrigin;
  state: CarbonState;
  nodeMap: NodeMap;
  selection: PointedSelection;
  changes: NodeIdSet; // tracks changed nodes
  removed: NodeIdSet = NodeIdSet.empty(); // tracks removed nodes

  private drafting = true;

  constructor(state: CarbonState, origin: ActionOrigin) {
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
  commit(depth: number): CarbonState {
    const { state, changes, selection } = this;

    const nodeMap = this.nodeMap.isEmpty ? state.nodeMap : this.nodeMap;
    const content = this.nodeMap.get(this.state.content.id)
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

    const newState = new CarbonState({
      previous: state.clone(depth - 1),
      scope: state.scope,
      content,
      selection: after,
      nodeMap,
      changes,
      counter: state.counter + 1,
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
    this.removed.forEach(id => {
      this.changes.remove(id);
    });

    const changed: NodeDepthEntry[] = this.changes.toArray().map(id => {
      const node = this.nodeMap.get(id)!;
      const depth = this.nodeMap.parents(node).length;
      return {
        node,
        depth
      }
    });

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

    this.mutable(nodeId, node => {
      node.children.forEach(child => {
        this.nodeMap.delete(child.id);
      });

      if (node.isTextBlock) {
        node.updateProps({
          [PlaceholderPath]: content.isEmpty? this.nodeMap.parent(node)?.properties.get<string>(EmptyPlaceholderPath) ?? '' : '',
        })
      } else if (node.name === 'text') {

      }
      console.log(content);
      node.updateContent(content);
    });

    // console.log('inserting content', nodeId.toString(), content.size);
    content.children.forEach(child => {
      this.nodeMap.set(child.id, child);
    })
  }

  move(to: Point, node: Node) {
    if (!this.drafting) {
      throw new Error("Cannot move node to a draft that is already committed");
    }

    if (node.frozen) {
      throw Error('cannot insert immutable node, it must be at least mutable at top level');
    }

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

    this.mutable(parentId, parent => {
      node.nextSiblings?.forEach(ch => this.mutable(ch.id));
      parent.remove(node)
    });

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
      console.log('children', node);
      node.forAll(n => {
        console.log('inserting node', n.id.toString(), n.name);
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
      parent.prepend(node)
    });
  }

  private append(parentId: NodeId, node: Node) {
    this.mutable(parentId, parent => parent.append(node));
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
      parent.insertBefore(refNode, node)
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
      parent.insertAfter(refNode, node)
    });
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
      parent.children.forEach(ch => this.mutable(ch.id));

      // if parent title is empty, set placeholder from parent
      if (parent.isTextBlock && parent.isEmpty) {
        const placeholder = this.nodeMap.parent(parent)?.properties.get<string>(EmptyPlaceholderPath) ?? ''
        parent.updateProps({
          [PlaceholderPath]: placeholder,
        })

        // console.log(parent.properties.toKV());
      }
    });

    node.forAll(n => {
      this.removed.add(n.id);
    });
  }

  changeName(nodeId: NodeId, type: NodeType) {
    if (!this.drafting) {
      throw new Error("Cannot change name on a draft that is already committed");
    }


    this.mutable(nodeId, node => {
      node.changeType(type);
      node.nextSiblings?.forEach(ch => this.mutable(ch.id));

      if (node.isContainerBlock && node.firstChild?.isEmpty) {
        this.mutable(node.firstChild.id, child => {
          child.updateProps({
            [PlaceholderPath]: type.props.get<string>(EmptyPlaceholderPath) ?? '',
          })
        })
      }
    });
  }

  updateProps(nodeId: NodeId, props: Partial<NodePropsJson>) {
    if (!this.drafting) {
      throw new Error("Cannot change name on a draft that is already committed");
    }

    console.log('before update props', this.nodeMap.get(nodeId)?.properties.toKV());

    this.mutable(nodeId, node => {
      node.updateProps(props);
    });

    console.log('after update props', this.nodeMap.get(nodeId)?.properties.toKV());
  }

  updateSelection(selection: PointedSelection) {
    if (!this.drafting) {
      throw new Error("Cannot update selection on a draft that is already committed");
    }

    console.log('update selection');
    this.selection = selection;

    if (this.state.selection.isInline && this.state.selection.isCollapsed) {
      const { head } = this.state.selection.unpin();
      const node = this.nodeMap.get(head.nodeId);
      if (!node) {
        throw new Error("Cannot update selection on a draft that is already committed");
      }

      if (node.isEmpty) {
        this.mutable(head.nodeId, node => {
          const parent = this.nodeMap.parent(node);
          if (!parent) return
          node.updateProps({
            [PlaceholderPath]: parent.properties.get<string>(EmptyPlaceholderPath) ?? '',
          })

          console.log('xxx', parent.name, parent.id.toString(), parent.properties.get<string>(EmptyPlaceholderPath), node.properties.toKV());
        })
      }
    }

    // update focus placeholder if needed
    if (selection.isCollapsed && selection.isInline) {
      const { head } = selection;
      const node = this.nodeMap.get(head.nodeId);
      if (!node) {
        throw new Error("Cannot update selection on a draft that is already committed");
      }

      if (node.isEmpty) {
        this.mutable(head.nodeId, node => {
          const parent = this.nodeMap.parent(node);
          if (!parent) return
          node.updateProps({
            [PlaceholderPath]: parent.properties.get<string>(FocusedPlaceholderPath) ?? '',
          })
        })
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
