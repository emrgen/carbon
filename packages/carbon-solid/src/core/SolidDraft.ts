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

export class SolidDraft implements Draft {

  changes: NodeMap = SolidNodeMap.empty();

  constructor(private state: State) {}

  produce(fn: (draft: Draft) => void): State {
    // start recording the changes
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
    return undefined;
  }

  parent(from: NodeId | Node): Optional<Node> {
    return undefined;
  }

  change(nodeId: NodeId, type: NodeType): void {
  }

  insert(at: Point, node: Node): void {
  }

  move(to: Point, node: Node): void {
  }

  remove(node: Node): void {
  }

  updateContent(nodeId: NodeId, content: Node[]|string): void {}

  updateProps(nodeId: NodeId, props: Partial<NodePropsJson>) {
  }

  updateSelection(selection: PointedSelection): void {
  }
}
