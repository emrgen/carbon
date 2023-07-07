import { classString } from "../Logger";
import { Node } from "../Node";
import { NodeId } from "../NodeId";
import { Transaction } from "../Transaction";
import { ActionResult, NULL_ACTION_RESULT } from "./Result";
import { CarbonAction, ActionOrigin, ActionType } from "./types";
import { generateActionId } from "./utils";
import { NodeIdSet } from '../BSet';
import { NodeAttrs } from '../NodeAttrs';
import { NodeData } from "../NodeData";
import { Optional } from '@emrgen/types';


export class UpdateData implements CarbonAction {
  type: ActionType;
  id: number;
  prevData: Optional<NodeData>;

  static fromJSON(json) { }

  static create(nodeId: NodeId, data: Partial<NodeData>, origin: ActionOrigin) {
    return new UpdateData(nodeId, data, origin);
  }

  constructor(readonly nodeId: NodeId, readonly data: Partial<NodeData>, readonly origin: ActionOrigin) {
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

    this.prevData = node.data;
    node.updateData(this.data);
    tr.updated(node);

    return NULL_ACTION_RESULT
  }

  inverse(): CarbonAction {
    const { nodeId, prevData } = this;
    return UpdateData.create(nodeId, prevData!, ActionOrigin.UserInput);
  }

  toString() {
    return classString(this)(this.nodeId.toString())
  }

  toJSON() {
    throw new Error("Method not implemented.");
  }

}
