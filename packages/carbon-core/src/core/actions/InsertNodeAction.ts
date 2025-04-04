import { Draft } from "../Draft";
import { classString } from "../Logger";
import { Node } from "../Node";
import { NodeId } from "../NodeId";
import { Point } from "../Point";
import { NodeJSON } from "../types";
import { RemoveNodeAction } from "./RemoveNodeAction";
import { ActionOrigin, ActionType, CarbonAction, TxType } from "./types";

export class InsertNodeAction implements CarbonAction {
  readonly type = ActionType.insert;
  readonly txType: TxType = TxType.TwoWay;

  static fromNode(at: Point, node: Node, origin: ActionOrigin = ActionOrigin.UserInput) {
    return new InsertNodeAction(at, node.id, node.toJSON(), origin);
  }

  static create(
    at: Point,
    id: NodeId,
    node: Node | NodeJSON,
    origin: ActionOrigin = ActionOrigin.UserInput,
  ) {
    if (node instanceof Node) {
      return InsertNodeAction.fromNode(at, node, origin);
    }
    return new InsertNodeAction(at, id, node, origin);
  }

  constructor(
    readonly at: Point,
    readonly nodeId: NodeId,
    readonly node: NodeJSON,
    readonly origin: ActionOrigin,
  ) {}

  execute(draft: Draft) {
    const { at, node: json } = this;
    // create a mutable node from json
    console.log("inserting node", json);
    const { schema } = draft;
    const node = schema.nodeFromJSON(json)!;

    const refNode = draft.get(at.nodeId);
    if (!refNode) {
      throw new Error("failed to find target node from: " + at.toString());
    }
    const parent = draft.parent(refNode);
    if (!parent) {
      throw new Error("failed to find parent node from: " + at.toString());
    }

    // const clone = node.clone(deepCloneMap);
    draft.insert(at, node);
  }

  inverse(): CarbonAction {
    const { at, nodeId, node: json } = this;
    // TODO: check if nodeJson and node should be the same
    return RemoveNodeAction.create(at, nodeId, json, this.origin);
  }

  toString() {
    const { at, nodeId } = this;
    console.log();

    return classString(this)({
      at: at.toString(),
      nodes: nodeId.toString(),
    });
  }

  toJSON() {
    return {
      type: ActionType.insert,
      nodeId: this.nodeId.toString(),
      node: this.node,
      at: this.at.toJSON(),
      origin: this.origin,
    };
  }
}
