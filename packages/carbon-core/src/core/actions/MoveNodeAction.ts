import { Draft } from "@emrgen/carbon-core";
import { classString } from "../Logger";
import { NodeId } from "../NodeId";
import { Point } from "../Point";
import { ActionOrigin, ActionType, CarbonAction } from "./types";

// a node can be moved to a new location, relative to another node
// the node can be moved before, after, or inside the target node at start or end
export class MoveNodeAction implements CarbonAction {
  readonly type = ActionType.move;

  static create(
    from: Point,
    to: Point,
    nodeId: NodeId,
    origin: ActionOrigin = ActionOrigin.UserInput,
  ) {
    return new MoveNodeAction(from, to, nodeId, origin);
  }

  constructor(
    readonly from: Point,
    readonly to: Point,
    readonly nodeId: NodeId,
    readonly origin: ActionOrigin,
  ) {}

  execute(draft: Draft) {
    const { to, nodeId } = this;

    const node = draft.get(nodeId);
    if (!node) {
      throw Error("Failed to get target node from draft: " + nodeId.toString());
    }

    const refNode = draft.get(to.nodeId);
    if (!refNode) {
      throw new Error("Failed to get ref node: " + to.nodeId.toString());
    }

    // do not clone the node here.
    // if cloning is required, it should be done in the draft implementation
    draft.move(to, nodeId);
  }

  inverse(): CarbonAction {
    const { from, to, nodeId } = this;
    return MoveNodeAction.create(to, from, nodeId, this.origin);
  }

  toString() {
    const { from, to, nodeId } = this;
    return classString(this)({
      from: from.toString(),
      to: to.toString(),
      nodeId: nodeId.toString(),
    });
  }

  toJSON(): any {
    return {
      type: ActionType.move,
      from: this.from.toJSON(),
      to: this.to.toJSON(),
      nodeId: this.nodeId.toJSON(),
      origin: this.origin,
    };
  }
}
