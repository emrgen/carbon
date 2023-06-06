import { classString } from "../Logger";
import { Node } from "../Node";
import { NodeId } from "../NodeId";
import { Transaction } from "../Transaction";
import { ActionResult, NULL_ACTION_RESULT } from "./Result";
import { Action, ActionOrigin, ActionType } from "./types";
import { generateActionId } from "./utils";
import { NodeIdSet } from '../BSet';


export class SelectNodesAction implements Action {
  type: ActionType;
  id: number;
  origin: ActionOrigin;
  nodeIds: NodeId[];

  static fromJSON(json) { }

  static create(nodeIds: NodeId[], origin: ActionOrigin) {
    return new SelectNodesAction(nodeIds, origin);
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
    const {store, state} = app;
    const { selectedNodeIds } = state;
    const beforeSelectedNodes = selectedNodeIds.map(id => store.get(id)) as Node[];

    const afterSelectedNodes = this.nodeIds.map(id => store.get(id)) as Node[];
    beforeSelectedNodes.filter(n => n.isSelected).forEach(n => {
      n.updateData({ state: { selected: false } });
    });
    afterSelectedNodes.forEach(n => {
      n.updateData({ state: { selected: true } });
    });

    console.log(afterSelectedNodes.map(n => n.id.toString()));

    tr.selected(...beforeSelectedNodes);
    tr.selected(...afterSelectedNodes);
    return NULL_ACTION_RESULT
  }

  inverse(): Action {
    throw new Error("Method not implemented.");
  }

  toString() {
    return classString(this)([this.nodeIds.map(id => id.toString())])
  }

  toJSON() {
    throw new Error("Method not implemented.");
  }

}
