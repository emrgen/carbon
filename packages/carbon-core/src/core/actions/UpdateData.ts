import { classString } from "../Logger";
import { Node } from "../Node";
import { NodeId } from "../NodeId";
import { Transaction } from "../Transaction";
import { ActionResult, NULL_ACTION_RESULT } from "./Result";
import { CarbonAction, ActionOrigin, ActionType } from "./types";
import { generateActionId } from "./utils";
import { NodeIdSet } from '../BSet';
import { NodeAttrs } from '../NodeAttrs';


export class UpdateAttrs implements CarbonAction {
  type: ActionType;
  id: number;

  static fromJSON(json) { }

  static create(nodeId: NodeId, attrs: Partial<NodeAttrs>, origin: ActionOrigin) {
    return new UpdateAttrs(nodeId, attrs, origin);
  }

  constructor(readonly nodeId: NodeId, readonly attrs: Partial<NodeAttrs>, readonly origin: ActionOrigin) {
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

    node.updateAttrs(this.attrs);
    tr.updated(node);

    return NULL_ACTION_RESULT
  }

  inverse(): CarbonAction {
    throw new Error("Method not implemented.");
  }

  toString() {
    return classString(this)(this.nodeId.toString())
  }

  toJSON() {
    throw new Error("Method not implemented.");
  }

}
