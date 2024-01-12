import { ActionOrigin, CarbonAction, MoveNodeAction, Node, NodeId, Point, RemoveNodeAction } from "../core";
import { InsertNodeAction } from "../core/actions/InsertNodeAction";
import { nodeLocation } from "./location";
import {flatten} from "lodash";

export const moveNodesActions = (to: Point, nodes: Node[], origin: ActionOrigin = ActionOrigin.UserInput) => {
  const actions: CarbonAction[] = [];
  nodes.slice().reverse().forEach(n => {
    const from = nodeLocation(n);
    if (!from) {
      throw new Error('Node has no location');
    }

    actions.push(MoveNodeAction.create(from, to, n.id, origin));
  });

  return actions
}

export const insertNodesActions = (at: Point, nodes: Node[], origin: ActionOrigin = ActionOrigin.UserInput) => {
  const actions: CarbonAction[] = [];
  nodes.slice().reverse().forEach(node => {
    actions.push(InsertNodeAction.fromNode(at, node, origin))
  });

  return actions;
}

export const removeNodesActions = (nodes: Node[] | Node, origin: ActionOrigin = ActionOrigin.UserInput) => {
  const actions: CarbonAction[] = [];
  flatten([nodes]).slice().reverse().forEach(n => {
    actions.push(RemoveNodeAction.fromNode(nodeLocation(n)!, n, origin));
  });

  return actions;
}

export const insertBeforeAction = (before: Node, node: Node,  origin: ActionOrigin = ActionOrigin.UserInput) => {
  const at = before.prevSibling ? Point.toAfter(before.prevSibling!.id) : Point.toStart(before.parent!.id);
  return InsertNodeAction.fromNode(at, node, origin);
}

export const insertAfterAction = (after: Node, node: Node,  origin: ActionOrigin = ActionOrigin.UserInput) => {
  const at = Point.toAfter(after!.id)
  return InsertNodeAction.fromNode(at, node, origin);
}
