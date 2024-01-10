import { classString } from "../Logger";
import { IntoNodeId, NodeId } from "../NodeId";
import { Transaction } from "../Transaction";
import { CarbonAction, ActionOrigin, ActionType } from "./types";
import { Optional } from '@emrgen/types';
import { NodePropsJson } from "../NodeProps";
import {Draft} from "@emrgen/carbon-core";

export class UpdatePropsAction implements CarbonAction {
  private prevProps: Optional<NodePropsJson>;

  static create(nodeRef: IntoNodeId, props: Partial<NodePropsJson>, origin: ActionOrigin = ActionOrigin.UserInput) {
    return new UpdatePropsAction(nodeRef.nodeId(), props, origin);
  }

  constructor(readonly nodeId: NodeId, readonly props: Partial<NodePropsJson>, readonly origin: ActionOrigin) {}

  execute( draft: Draft) {
    const { nodeId } = this;
    const node = draft.get(nodeId)
    if (!node) {
      throw Error('update attrs: node not found')
    }

    this.prevProps = node.props.toJSON();
    draft.updateProps(nodeId, this.props);
  }

  inverse(): CarbonAction {
    const { nodeId, prevProps } = this;
    return UpdatePropsAction.create(nodeId, prevProps!, ActionOrigin.UserInput);
  }

  toString() {
    return classString(this)(this.nodeId.toString())
  }

  toJSON() {
    throw new Error("Method not implemented.");
  }

}
