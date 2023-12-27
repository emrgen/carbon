import {
  Draft,
  NodeId,
  NodePropsJson,
  NodeType,
  Point,
  PointedSelection,
  State,
  Node,
  NodeBTree, NodeIdSet
} from "@emrgen/carbon-core";
import {Optional, With} from "@emrgen/types";

export class VueDraft implements Draft {

  changes: NodeIdSet = NodeIdSet.empty();

  constructor(readonly state: State) {}

  change(nodeId: NodeId, type: NodeType): void {
  }

  get(id: NodeId): Optional<Node> {
    return this.state.nodeMap.get(id);
  }

  insert(at: Point, node: Node): void {
  }

  move(to: Point, node: Node): void {
  }

  parent(from: NodeId | Node): Optional<Node> {
    return undefined;
  }

  produce(fn: (draft: Draft) => void): State {
    try {
      fn(this);
    } catch (e) {
      this.rollback();
    } finally {
      this.state.changes.clear();
      this.changes.forEach(id => this.state.changes.add(id));
      
      return this.state;
    }
  }

  rollback(): void {

  }

  remove(node: Node): void {
  }

  updateContent(nodeId: NodeId, content: Node[] | string): void {
    this.node(nodeId, node => {
      node.updateContent(content);
      this.changes.add(nodeId);
    })
  }

  updateProps(nodeId: NodeId, props: Partial<NodePropsJson>): void {
  }

  updateSelection(selection: PointedSelection): void {
  }

  private node(id: NodeId, fn?: With<Node>): Optional<Node> {
    const node = this.state.nodeMap.get(id);
    if (!node) {
      throw new Error(`Node with id ${id} not found`);
    }

    fn?.(node);

    return node;
  }
}
