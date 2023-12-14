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
import { NodeStateJSON } from "../NodeState";


export class UpdateState implements CarbonAction {
  readonly type: ActionType;
  readonly id: number;
  private prevState: Optional<NodeStateJSON>;
  readonly nodeId: NodeId;

  static create(nodeRef: IntoNodeId, state: Partial<NodeStateJSON>, origin: ActionOrigin) {
    return new UpdateState(nodeRef, state, origin);
  }

  constructor(nodeRef: IntoNodeId, readonly state: Partial<NodeStateJSON>, readonly origin: ActionOrigin) {
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

    this.prevState = node.state.toJSON()
    draft.updateState(nodeId, this.state);
  }

  inverse(origin = ActionOrigin.UserInput): CarbonAction {
    const { nodeId, prevState } = this;
    return UpdateState.create(nodeId, prevState!, origin);
  }

  toString() {
    return classString(this)(this.nodeId.toString())
  }

  toJSON() {
    throw new Error("Method not implemented.");
  }

}
