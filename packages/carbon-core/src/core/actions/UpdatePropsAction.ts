import { Draft } from "@emrgen/carbon-core";
import { keys } from "lodash";
import { classString } from "../Logger";
import { IntoNodeId, NodeId } from "../NodeId";
import { NodePropsJson } from "../NodeProps";
import { ActionOrigin, ActionType, CarbonAction } from "./types";

export class UpdatePropsAction implements CarbonAction {
  readonly type = ActionType.props;
  before: Partial<NodePropsJson>;

  static create(
    nodeRef: IntoNodeId,
    props: Partial<NodePropsJson>,
    origin: ActionOrigin = ActionOrigin.UserInput,
  ) {
    return new UpdatePropsAction(nodeRef.nodeId(), {}, props, origin);
  }

  static withBefore(
    nodeRef: IntoNodeId,
    before: Partial<NodePropsJson>,
    after: Partial<NodePropsJson>,
    origin: ActionOrigin = ActionOrigin.UserInput,
  ) {
    return new UpdatePropsAction(nodeRef.nodeId(), before, after, origin);
  }

  constructor(
    readonly nodeId: NodeId,
    before: Partial<NodePropsJson>,
    readonly after: Partial<NodePropsJson>,
    readonly origin: ActionOrigin,
  ) {
    this.before = before;
  }

  execute(draft: Draft) {
    const { nodeId } = this;
    const node = draft.get(nodeId);
    if (!node) {
      throw Error("update attrs: node not found");
    }

    const before = {};
    keys(this.after).forEach((key) => {
      before[key] = node.props.get(key);
    });

    console.log("update props", before, this.after);

    this.before = before ?? {};
    draft.updateProps(nodeId, this.after);
  }

  inverse(): CarbonAction {
    const { nodeId, after, before } = this;
    console.log("inverse", nodeId, after, before);
    return UpdatePropsAction.withBefore(
      nodeId,
      after,
      before!,
      ActionOrigin.UserInput,
    );
  }

  toString() {
    return classString(this)(this.nodeId.toString());
  }

  toJSON() {
    return {
      type: ActionType.props,
      nodeId: this.nodeId,
      before: this.before,
      after: this.after,
      origin: this.origin,
    };
  }
}
