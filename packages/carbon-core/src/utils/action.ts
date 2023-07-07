import { ActionOrigin, CarbonAction, MoveAction, Node, Point, RemoveNode } from "../core"
import { InsertNode } from "../core/actions/InsertNode";
import { nodeLocation } from "./location";

export const moveNodesAction = (to: Point, nodes: Node[], origin: ActionOrigin = ActionOrigin.UserInput) => {
  const from = nodeLocation(nodes[0]!)!;
  return new MoveAction(from, to, nodes.map(n => n.id), origin)
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

