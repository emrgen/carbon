import { Optional } from "@emrgen/types";
import { MarkAction } from "./actions/index";
import { Mark, MarkSet } from "./Mark";
import { Node } from "./Node";
import { NodeId } from "./NodeId";
import { NodePropsJson } from "./NodeProps";
import { NodeType } from "./NodeType";
import { Point } from "./Point";
import { PointedSelection } from "./PointedSelection";
import { Schema } from "./Schema";
import { State } from "./State";

// Draft is responsible for producing a state after a Transaction
// Actions delegate the state update to the draft
export interface Draft {
  schema: Schema;
  marks: MarkSet;
  // nodeMap: NodeMap;

  // used to verify and prepare the actions before apply
  get(id: NodeId): Optional<Node>;

  // get the parent of the node
  parent(from: NodeId | Node): Optional<Node>;

  // produce creates a new draft and pass to the fn to update the draft
  // if the fn fails then the draft is rolled back to the previous state
  // if the fn succeeds then the draft is committed and the new state is returned
  produce(fn: (draft: Draft) => void): State;

  // actions to update the draft
  insert(at: Point, node: Node): void;

  insertText(at: Point, text: string): void;

  move(to: Point, nodeId: NodeId): void;

  remove(nodeId: NodeId): void;

  change(nodeId: NodeId, type: NodeType): void;

  updateProps(nodeId: NodeId, props: Partial<NodePropsJson>): void;

  updateMark(action: MarkAction, mark: Mark): void;

  updateContent(nodeId: NodeId, content: Node[] | string): void;

  updateSelection(selection: PointedSelection): void;

  insertFragment(at: Point, nodes: Node[]): void;

  removeFragment(from: Point, fragment: Node[]): void;
}
