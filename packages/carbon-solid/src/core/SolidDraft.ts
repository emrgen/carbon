import {Optional} from "@emrgen/types";
import {
  Draft,
  Node,
  NodeId,
  NodeMap,
  NodePropsJson,
  NodeType,
  Point, PointAt,
  PointedSelection,
  State
} from "@emrgen/carbon-core";
import {SolidNodeMap} from "./NodeMap";
import {isArray} from "lodash";
import {p14} from "@emrgen/carbon-core/src/core/Logger";

export class SolidDraft implements Draft {

  changes: NodeMap = SolidNodeMap.empty();
  deleted: NodeMap = SolidNodeMap.empty();

  constructor(private state: State) {}

  get nodeMap(): NodeMap {
    return this.state.nodeMap;
  }

  produce(fn: (draft: Draft) => void): State {
    // start recording the changes
    this.state.isSelectionChanged = false;
    try {
      fn(this);
      this.commit();
    } catch (e) {
      this.rollback();
    } finally {
      return this.state;
    }
  }

  commit() {
    this.deleted.forEach(node => {
      this.nodeMap.delete(node.id);
    })
  }

  // use the changes to revert the state
  rollback(): void {}

  get(id: NodeId): Optional<Node> {
    const node = this.state.nodeMap.get(id);
    if (!node) {
      throw new Error(`Node ${id.toString()} not found`);
    }

    return node;
  }

  parent(from: NodeId | Node): Optional<Node> {
    if (from instanceof Node) {
      const {parentId} = from;
      if (!parentId) {
        return null;
      }

      return this.get(parentId);
    }

    const node = this.get(from);
    if (!node) {
      throw new Error(`Node ${from.toString()} not found`);
    }

    return this.parent(node);
  }

  change(nodeId: NodeId, type: NodeType): void {
    console.log(p14('%c[trap]'), "color:green", 'change', nodeId.toString(), type.name);
    const node = this.get(nodeId);
    if (!node) {
      throw new Error(`Node ${nodeId.toString()} not found`);
    }

    node.changeType(type);
  }

  move(to: Point, node: Node): void {
    console.log(p14('%c[trap]'), "color:green", 'move', to.toString(), node.toString());

    const refNode = this.get(to.nodeId);
    if (!refNode) {
      throw new Error(`Node ${to.nodeId.toString()} not found`);
    }


    const { parent } = node;
    if (!parent) {
      throw new Error(`Parent of ${node.id.toString()} not found`);
    }

    node.all(n => {
      this.nodeMap.delete(n.id);
    })

    parent.remove(node);
    this.insert(to, node, "move");
  }

  insert(at: Point, node: Node, type: "create" | "move" = "create") {
    console.log('[trap] insert', at.toString(), node.toString());

    const refNode = this.get(at.nodeId);
    if (!refNode) {
      throw new Error(`Node ${at.nodeId.toString()} not found`);
    }
    const parent = this.parent(refNode);
    if (!parent) {
      throw new Error(`Parent of ${refNode.id.toString()} not found`);
    }

    node.all(n => {
      this.nodeMap.set(n.id, n);
      this.deleted.deleted(n.id);
    });

    // const index = refNode.index;
    // console.log('# adding new child node', 'parent', parent.id.toString(), 'index', index, 'node', node.id.toString())
    // parent.insert(node, index + 1);

    switch (at.at) {
      case PointAt.After:
        return this.insertAfter(node, refNode);
      case PointAt.Before:
        return this.insertBefore(node, refNode);
      case PointAt.Start:
        return this.prepend(node, refNode);
      case PointAt.End:
        return this.append(node, refNode);
    }

    throw new Error("Invalid insertion point");
  }

  private insertBefore(node: Node, refNode: Node) {
    console.log(p14('%c[trap]'), "color:green", 'insertBefore', node.toString(), refNode.toString());
    const parent = this.parent(refNode);
    if (!parent) {
      throw new Error(`Parent of ${refNode.id.toString()} not found`);
    }

    const index = refNode.index;
    console.log('# adding new child node', 'parent', parent.id.toString(), 'index', index, 'node', node.id.toString())
    parent.insert(node, index);
  }

  private insertAfter(node: Node, refNode: Node) {
    console.log(p14('%c[trap]'), "color:green", 'insertAfter', node.toString(), refNode.toString());
    const parent = this.parent(refNode);
    if (!parent) {
      throw new Error(`Parent of ${refNode.id.toString()} not found`);
    }

    const index = refNode.index;
    console.log('# adding new child node', 'parent', parent.id.toString(), 'index', index, 'node', node.id.toString())
    parent.insert(node, index + 1);
  }

  private prepend(node: Node, refNode: Node) {
    console.log(p14('%c[trap]'), "color:green", 'prepend', node.toString(), refNode.toString());
    refNode.insert(node, 0);
  }

  private append(node: Node, refNode: Node) {
    console.log(p14('%c[trap]'), "color:green", 'append', node.toString(), refNode.toString());
    refNode.insert(node, refNode.children.length);
  }

  remove(node: Node): void {
    console.log(p14('%c[trap]'), "color:green", 'remove', node.toString());
    const parent = this.parent(node);
    parent?.remove(node);
    node.all(n => {
      // this.nodeMap.delete(n.id);
      this.deleted.set(n.id, n);
    })
  }

  updateContent(nodeId: NodeId, content: Node[]|string): void {
    console.log('[trap] updateContent', nodeId.toString(), content);
    const node = this.state.nodeMap.get(nodeId);
    if (!node) {
      throw new Error(`Node ${nodeId.toString()} not found`);
    }

    if (isArray(content)) {
      content.forEach(n => {
        n.all(child => {
          this.nodeMap.set(child.id, child);
        })
      })
    }

    node.updateContent(content);
  }

  updateProps(nodeId: NodeId, props: Partial<NodePropsJson>) {
    console.log('[trap] updateProps', nodeId.toString(), props);
    if (this.deleted.has(nodeId)) {
      return;
    }

    const node = this.state.nodeMap.get(nodeId);
    if (!node) {
      throw new Error(`Node ${nodeId.toString()} not found`);
    }

    node.updateProps(props);
  }

  updateSelection(selection: PointedSelection): void {
    console.log('updateSelection', selection.toString());
    const pinned = selection.pin(this.state.nodeMap);
    if (!pinned) {
      throw new Error('Invalid selection');
    }
    this.state.selection = pinned;

    this.state.isSelectionChanged = true;
  }
}
