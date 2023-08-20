import { classString } from "../Logger";
import { Node } from "../Node";
import { NodeId } from "../NodeId";
import { Transaction } from "../Transaction";
import { ActionResult, NULL_ACTION_RESULT } from "./Result";
import { CarbonAction, ActionOrigin, ActionType } from "./types";
import { generateActionId } from "./utils";
import { NodeIdSet } from '../BSet';


export class SelectNodes implements CarbonAction {
  type: ActionType;
  id: number;
  origin: ActionOrigin;
  nodeIds: NodeId[];
  prevNodeIds: NodeId[] = [];

  static fromJSON(json) { }

  static create(nodeIds: NodeId[], origin: ActionOrigin) {
    return new SelectNodes(nodeIds, origin);
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

    this.prevNodeIds = app.blockSelection.nodeIds.toArray()

    const beforeSelectedNodes = selectedNodeIds.map(id => store.get(id)) as Node[];

    const afterSelectedNodes = this.nodeIds.map(id => store.get(id)) as Node[];
    beforeSelectedNodes.filter(n => n.isSelected).forEach(n => {
      n.updateState({  selected: false } );
    });
    afterSelectedNodes.forEach(n => {
      n.updateState({ selected: true });
    });

    const { selection } = app

    // if blockSelection is non empty hide cursor and text selection
    if (afterSelectedNodes.length !== 0) {
      const { start, end } = selection;
      const nodes: Node[] = [];
      // selection.start.node.walk(n => {
      //   nodes.push(n);
      //   if (n.eq(end.node)) {
      //     return true
      //   }
      //   return false
      // })
      // nodes.forEach(n => {
      //   // n?.updateAttrs({ html: { 'data-hide-cursor': true } });
      //   tr.updated(n!);
      // })
      // nodes.forEach(n => {
      //   app.runtime.hideCursorNodeIds.add(n.id);
      // });
    } else {
      // app.runtime.hideCursorNodeIds.forEach(id => {
      //   const node = app.store.get(id);
      //   if (!node) return

      //   node.updateAttrs({ html: { 'data-hide-cursor': false } });
      //   tr.updated(node);
      // });
      // app.runtime.hideCursorNodeIds.clear();
    }

    // console.log(afterSelectedNodes.map(n => n.id.toString()));
    tr.selected(...beforeSelectedNodes);
    tr.selected(...afterSelectedNodes);
    return NULL_ACTION_RESULT
  }

  inverse(): CarbonAction {
    return new SelectNodes(this.prevNodeIds, this.origin);
  }

  toString() {
    return classString(this)([this.nodeIds.map(id => id.toString())])
  }

  toJSON() {
    return {
      type: this.type,
      id: this.id,
      ids: this.nodeIds.map(id => id.toString()),
    }
  }

}
