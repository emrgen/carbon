import { ActionOrigin, CarbonAction, MoveAction, Node, Point, RemoveNode } from "../core"
import { InsertNode } from "../core/actions/InsertNode";
import { nodeLocation } from "./location";

export const moveNodesActions = (to: Point, nodes: Node[], origin: ActionOrigin = ActionOrigin.UserInput) => {
  const actions: CarbonAction[] = [];
  nodes.slice().reverse().forEach(n => {
    const from = nodeLocation(n);
    if (!from) {
      throw new Error('Node has no location');
    }

    actions.push(MoveAction.create(from, to, n.id, origin));
  });

  return actions
}


export const insertNodesActions = (at: Point, nodes: Node[], origin: ActionOrigin = ActionOrigin.UserInput) => {
  const actions: CarbonAction[] = [];
  nodes.slice().reverse().forEach(node => {
    actions.push(InsertNode.create(at, node, origin))
  });

  return actions;
}

export const removeNodesActions = (nodes: Node[], origin: ActionOrigin = ActionOrigin.UserInput) => {
  const actions: CarbonAction[] = [];
  nodes.slice().reverse().forEach(n => {
    actions.push(RemoveNode.create(nodeLocation(n)!, n.id));
  });

  return actions;
}

export const insertBeforeAction = (before: Node, node: Node,  origin: ActionOrigin = ActionOrigin.UserInput) => {
  const at = before.prevSibling ? Point.toAfter(before.prevSibling!.id) : Point.toStart(before.parent!.id);
  return InsertNode.create(at, node, origin);
}

export const insertAfterAction = (after: Node, node: Node,  origin: ActionOrigin = ActionOrigin.UserInput) => {
  const at = Point.toAfter(after!.id)
  return InsertNode.create(at, node, origin);
}
