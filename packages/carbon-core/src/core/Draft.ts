import {Node, NodeId, NodePropsJson, NodeType, Point, PointedSelection, Schema, State} from "@emrgen/carbon-core";
import {Optional} from "@emrgen/types";

// Draft is responsible for producing a state after a Transaction
// Actions delegate the state update to the draft
export interface Draft {
  schema: Schema;
  // nodeMap: NodeMap;

  // produce creates a new draft and pass to the fn to update the draft
  // if the fn fails then the draft is rolled back to the previous state
  // if the fn succeeds then the draft is committed and the new state is returned
  produce(fn: (draft: Draft) => void): State;

  // actions to update the draft
  insert(at: Point, node: Node): void;
  insertText(at: Point, text: string): void;
  move(to: Point, nodeId: NodeId): void
  remove(nodeId: NodeId): void;
  change(nodeId: NodeId, type: NodeType): void;
  updateProps(nodeId: NodeId, props: Partial<NodePropsJson>): void
  updateContent(nodeId: NodeId, content: Node[]|string): void;
  updateSelection(selection: PointedSelection): void;

  // used to verify and prepare the actions before apply
  get(id: NodeId): Optional<Node>;
  // get the parent of the node
  parent(from: NodeId|Node): Optional<Node>;
}
