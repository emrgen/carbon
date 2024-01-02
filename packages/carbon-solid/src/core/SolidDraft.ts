import * as Core from '@emrgen/carbon-core';
import {Optional} from "@emrgen/types";
import {
  Draft,
  Node, NodeBTree,
  NodeContent,
  NodeId,
  NodeMap,
  NodePropsJson,
  NodeType,
  Point,
  PointedSelection,
  State
} from "@emrgen/carbon-core";
import {SolidNodeMap} from "./NodeMap";
import {isArray} from "lodash";

export class SolidDraft implements Draft {

  changes: NodeMap = SolidNodeMap.empty();

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

  }

  rollback(): void {

  }

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
  }

  insert(at: Point, node: Node): void {
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
      this.nodeMap.set(n.id, n)
    })

    const index = refNode.index;
    console.log('# adding new child node', 'parent', parent.id.toString(), 'index', index, 'node', node.id.toString())
    parent.insert(node, index + 1);
  }

  move(to: Point, node: Node): void {
  }

  remove(node: Node): void {
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
