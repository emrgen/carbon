import { classString } from "../Logger";
import { Node } from "../Node";
import { NodeId } from "../NodeId";
import { Transaction } from "../Transaction";
import { ActionResult, NULL_ACTION_RESULT } from "./Result";
import { CarbonAction, ActionOrigin, ActionType } from "./types";
import { generateActionId } from "./utils";
import { NodeIdSet } from '../BSet';


export class ActivateNodes implements CarbonAction {
  type: ActionType;
  id: number;
  origin: ActionOrigin;
  nodeIds: NodeId[];

  static fromJSON(json) { }

  static create(nodeIds: NodeId[], origin: ActionOrigin) {
    return new ActivateNodes(nodeIds, origin);
  }

  constructor(nodeIds: NodeId[], origin: ActionOrigin) {
    this.type = ActionType.selectNodes;
    this.id = generateActionId();
    this.origin = origin;
    const ids = new NodeIdSet();
    nodeIds.forEach(id => ids.add(id));
    this.nodeIds = ids.toArray();
  }

  execute(tr: Transaction): ActionResult {
    const { app } = tr;
    const { store, state } = app;
    const { selectedNodeIds } = state;
    const beforeActivatedNodes = selectedNodeIds.map(id => store.get(id)) as Node[];

    const afterActivatedNodes = this.nodeIds.map(id => store.get(id)) as Node[];
    beforeActivatedNodes.filter(n => n.isActive).forEach(n => {
      n.updateState({ active: false });
    });
    afterActivatedNodes.forEach(n => {
      n.updateState({ active: true });
    });

    // console.log(afterActivatedNodes.map(n => n.id.toString()));

    tr.activated(...beforeActivatedNodes);
    tr.activated(...afterActivatedNodes);
    return NULL_ACTION_RESULT
  }

  inverse(): CarbonAction {
    throw new Error("Method not implemented.");
  }

  toString() {
    return classString(this)([this.nodeIds.map(id => id.toString())])
  }

  toJSON() {
    throw new Error("Method not implemented.");
  }

}
