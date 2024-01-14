import {Optional} from "@emrgen/types";
import {
  ActionOrigin,
  BlockSelection,
  Draft,
  Node,
  NodeId,
  NodeIdSet,
  NodeMap,
  NodePropsJson,
  NodeType,
  Point,
  PointAt,
  PointedSelection, Schema,
  SelectedPath,
  State, TransactionType
} from "@emrgen/carbon-core";
import {SolidNodeMap} from "./NodeMap";
import {isArray} from "lodash";
import {p14} from "@emrgen/carbon-core/src/core/Logger";

export class SolidDraft implements Draft {

  changes: NodeMap = SolidNodeMap.empty();
  deleted: NodeMap = SolidNodeMap.empty();
  contentChanged: NodeIdSet = NodeIdSet.empty();
  selected: NodeIdSet = NodeIdSet.empty();

  constructor(private state: State, readonly origin: ActionOrigin, readonly type: TransactionType, readonly schema: Schema) {
    this.schema = schema;
    state.blockSelection.blocks.forEach(node => {
      this.selected.add(node.id);
    });
  }

  insertText(at: Point, text: string): void {
      throw new Error("Method not implemented.");
  }

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
    }

    return this.state;
  }

  commit() {
    this.deleted.forEach(node => {
      this.nodeMap.delete(node.id);
    })
    this.contentChanged.forEach(id => {
      const node = this.nodeMap.get(id);
      if (!node) {
        throw new Error(`Node ${id.toString()} not found`);
      }
      console.log('[updated content]', node.key, node)
      node.contentVersion = node.contentVersion + 1
    });

    const selected = this.selected.nodes(this.nodeMap)
    this.state.blockSelection = BlockSelection.create(selected);
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

  move(to: Point, nodeId: NodeId): void {
    console.log(p14('%c[trap]'), "color:green", 'move', to.toString(), nodeId.toString());
    const node = this.get(nodeId);
    if (!node) {
      throw new Error(`Node ${nodeId.toString()} not found`);
    }

    const {parent} = node;
    if (!parent) {
      throw new Error(`Parent of ${node.id.toString()} not found`);
    }

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
    this.contentChanged.add(parent.id);
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
    this.contentChanged.add(parent.id);
  }

  private prepend(node: Node, parent: Node) {
    console.log(p14('%c[trap]'), "color:green", 'prepend', node.toString(), parent.toString());
    parent.insert(node, 0);
    this.contentChanged.add(parent.id);
  }

  private append(node: Node, parent: Node) {
    console.log(p14('%c[trap]'), "color:green", 'append', node.toString(), parent.toString());
    parent.insert(node, parent.children.length);
    this.contentChanged.add(parent.id);
  }

  remove(nodeId: NodeId): void {
    console.log(p14('%c[trap]'), "color:green", 'remove', nodeId.toString());
    const node = this.get(nodeId);
    if (!node) {
      throw new Error(`Node ${nodeId.toString()} not found`);
    }
    console.log(p14('%c[trap]'), "color:green", 'remove', node.toString());
    const parent = this.parent(node);
    if (!parent) {
      throw new Error(`Parent of ${node.id.toString()} not found`);
    }

    parent.remove(node);
    this.contentChanged.add(parent.id);
    node.all(n => {
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
    if (props[SelectedPath] === false) {
      this.selected.remove(nodeId);
    }

    if (props[SelectedPath] === true) {
      this.selected.add(nodeId);
    }
  }

  updateSelection(selection: PointedSelection): void {
    console.log('updateSelection', selection.toString());
    const pinned = selection.pin();
    if (!pinned) {
      throw new Error('Invalid selection');
    }
    this.state.selection = pinned;

    this.state.isSelectionChanged = true;
  }
}
