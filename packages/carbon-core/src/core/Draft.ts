// producer
import {Node, NodeContent, NodeId, NodePropsJson, NodeType, Point, PointedSelection, State} from "@emrgen/carbon-core";
import {Optional} from "@emrgen/types";

// producer factory is a function that creates a producer
// it helps to separate the producer from the the carbon-core
export type DraftFactory = (state: State) => Draft;

// producer is a class that is responsible for producing a state after a transaction
// it is inject into transaction/actions and is used to update the state
export interface Draft {
  // once the producer is created it is bound to a state
  // the bounded state is passed to this method to produce a new state
  produce(fn: (draft: Draft) => void): State;

  // private commit(): State;
  updateContent(nodeId: NodeId, content: NodeContent): void;
  insert(at: Point, node: Node): void;
  move(to: Point, node: Node): void
  remove(node: Node): void;

  change(nodeId: NodeId, type: NodeType): void;

  updateProps(nodeId: NodeId, props: Partial<NodePropsJson>): void

  updateSelection(selection: PointedSelection): void;

  get(id: NodeId): Optional<Node>;

  parent(from: NodeId|Node): Optional<Node>;

}
