import { classString } from "../Logger";
import { Node } from "../Node";
import { NodeId } from "../NodeId";
import { Transaction } from "../Transaction";
import { ActionResult, NULL_ACTION_RESULT } from "./Result";
import { CarbonAction, ActionOrigin, ActionType } from "./types";
import { generateActionId } from "./utils";
import { NodeIdSet } from '../BSet';
import { NodeAttrs } from '../NodeAttrs';
import { Optional } from '@emrgen/types';
import { NodeState } from '../NodeState';


export class UpdateData implements CarbonAction {
  type: ActionType;
  id: number;
  prevState: Optional<NodeState>;

  static fromJSON(json) { }

  static create(nodeId: NodeId, state: Partial<NodeState>, origin: ActionOrigin) {
    return new UpdateData(nodeId, state, origin);
  }

  constructor(readonly nodeId: NodeId, readonly state: Partial<NodeState>, readonly origin: ActionOrigin) {
    this.type = ActionType.updateAttrs;
    this.id = generateActionId();
  }

  execute(tr: Transaction): ActionResult {
    const { app } = tr;
    const { store, state } = app;
    const { nodeId } = this;
    const node = store.get(nodeId)
    if (!node) {
      console.warn('node not found', nodeId);
      return NULL_ACTION_RESULT
    }

    this.prevState = node.state;
    console.log('-->');

    node.updateState(this.state);
    tr.updated(node);

    return NULL_ACTION_RESULT
  }

  inverse(): CarbonAction {
    const { nodeId, prevState } = this;
    return UpdateData.create(nodeId, prevState!, ActionOrigin.UserInput);
  }

  toString() {
    return classString(this)(this.nodeId.toString())
  }

  toJSON() {
    throw new Error("Method not implemented.");
  }

}
