import { Draft } from "@emrgen/carbon-core";
import { classString } from "../Logger";
import { NodeId } from "../NodeId";
import { NodeName } from "../types";
import { ActionOrigin, ActionType, CarbonAction } from "./types";

export class ChangeNameAction implements CarbonAction {
  readonly type = ActionType.rename;

  static create(
    nodeId: NodeId,
    to: NodeName,
    origin: ActionOrigin = ActionOrigin.UserInput,
  ) {
    return new ChangeNameAction(nodeId, "", to, origin);
  }

  static withBefore(
    nodeId: NodeId,
    from: NodeName,
    to: NodeName,
    origin: ActionOrigin = ActionOrigin.UserInput,
  ) {
    return new ChangeNameAction(nodeId, from, to, origin);
  }

  constructor(
    readonly nodeId: NodeId,
    private from: string,
    readonly to: string,
    readonly origin: ActionOrigin,
  ) {
    this.from = from;
  }

  execute(draft: Draft) {
    const { nodeId, to } = this;
    const { schema } = draft;
    const target = draft.get(nodeId);
    if (!target) {
      throw new Error("failed to find node for: " + nodeId);
    }
    this.from = target.name;

    const type = schema.type(to);
    if (!type) {
      throw new Error("failed to find type for: " + to);
    }

    draft.change(nodeId, type);
  }

  inverse(): CarbonAction {
    const { nodeId, from, to } = this;
    if (!from) {
      throw new Error(
        "cant inverse, action is not executed:" + this.toString(),
      );
    }

    return ChangeNameAction.withBefore(
      nodeId,
      to,
      from,
      ActionOrigin.UserInput,
    );
  }

  toString() {
    const { from, to, nodeId } = this;
    return classString(this)({
      nodeId,
      from,
      to,
    });
  }

  toJSON() {
    return {
      type: ActionType.rename,
      nodeId: this.nodeId,
      from: this.from,
      to: this.to,
      origin: this.origin,
    };
  }
}
