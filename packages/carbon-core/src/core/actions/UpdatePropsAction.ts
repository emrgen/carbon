import { classString } from "../Logger";
import { IntoNodeId, NodeId } from "../NodeId";
import { Transaction } from "../Transaction";
import { CarbonAction, ActionOrigin, ActionType } from "./types";
import { Optional } from '@emrgen/types';
import { NodePropsJson } from "../NodeProps";
import {Draft} from "@emrgen/carbon-core";

export class UpdatePropsAction implements CarbonAction {

  static create(nodeRef: IntoNodeId, props: Partial<NodePropsJson>, origin: ActionOrigin = ActionOrigin.UserInput) {
    return new UpdatePropsAction(nodeRef.nodeId(), props, {}, origin);
  }

  static withBefore(nodeRef: IntoNodeId, props: Partial<NodePropsJson>, before: Partial<NodePropsJson>, origin: ActionOrigin = ActionOrigin.UserInput) {
    return new UpdatePropsAction(nodeRef.nodeId(), props, before, origin);
  }

  constructor(readonly nodeId: NodeId, readonly after: Partial<NodePropsJson>, private before: Partial<NodePropsJson>, readonly origin: ActionOrigin) {}

  execute( draft: Draft) {
    const { nodeId } = this;
    const node = draft.get(nodeId)
    if (!node) {
      throw Error('update attrs: node not found')
    }

    this.before = node.props.toJSON();
    draft.updateProps(nodeId, this.after);
  }

  inverse(): CarbonAction {
    const { nodeId, after, before } = this;
    return UpdatePropsAction.withBefore(nodeId, before, after!, ActionOrigin.UserInput);
  }

  toString() {
    return classString(this)(this.nodeId.toString())
  }

  toJSON() {
    throw new Error("Method not implemented.");
  }

}
