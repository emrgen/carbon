import { classString } from "../Logger";
import { Node } from "../Node";
import { IntoNodeId, NodeId } from "../NodeId";
import { Transaction } from "../Transaction";
import { ActionResult, NULL_ACTION_RESULT } from "./Result";
import { CarbonAction, ActionOrigin, ActionType } from "./types";
import { generateActionId } from "./utils";
import { NodeIdSet } from '../BSet';
import { NodeAttrs } from '../NodeAttrs';
import { Optional } from '@emrgen/types';
import { cloneDeep } from 'lodash';
import { CarbonStateDraft } from "../CarbonStateDraft";


export class UpdateAttrs implements CarbonAction {
  readonly type: ActionType;
  readonly id: number;
  private prevAttrs: Optional<NodeAttrs>;
  readonly nodeId: NodeId;

  static fromJSON(json) { }

  static create(nodeRef: IntoNodeId, attrs: Partial<NodeAttrs>, origin: ActionOrigin) {
    return new UpdateAttrs(nodeRef, attrs, origin);
  }

  constructor(nodeRef: IntoNodeId, readonly attrs: Partial<NodeAttrs>, readonly origin: ActionOrigin) {
    this.nodeId = nodeRef.intoNodeId()
    this.type = ActionType.updateAttrs;
    this.id = generateActionId();
  }

  execute(tr: Transaction, draft: CarbonStateDraft) {
    const { app } = tr;
    const { nodeId } = this;
    const node = draft.get(nodeId)
    if (!node) {
      throw Error('update attrs: node not found')
    }

    this.prevAttrs = node.attrs.clone().freeze();
    draft.updateAttrs(nodeId, this.attrs);
  }

  inverse(): CarbonAction {
    const { nodeId, prevAttrs } = this;
    return UpdateAttrs.create(nodeId, prevAttrs!, ActionOrigin.UserInput);
  }

  toString() {
    return classString(this)(this.nodeId.toString())
  }

  toJSON() {
    throw new Error("Method not implemented.");
  }

}
