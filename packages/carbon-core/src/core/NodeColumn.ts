import {CarbonAction, moveNodesActions, Node, Point, SetContentAction} from "@emrgen/carbon-core";
import {flatten, identity} from "lodash";

export class NodeColumn {
  nodes: Node[][] = [];

  static moveNodes(before: Node[], after: Node[]) {
    const lastNode = before[before.length-1];
    const at = Point.toAfter(lastNode);
    return moveNodesActions(at, after)
  }

  static mergeByMove(left: NodeColumn, right: NodeColumn): CarbonAction[] {
    const actions: CarbonAction[] = [];

    let rightLength = right.nodes.length-1;
    let leftLength = left.nodes.length-1;

    while (true) {
      const leftNodes = left.nodes[leftLength]
      const rightNodes = right.nodes[rightLength]

      if (!leftNodes || !rightNodes) {
        break;
      }

      const leftFirst = leftNodes[0];
      const rightFirst = rightNodes[0];

      if (leftFirst.isTextContainer && rightFirst.isTextContainer) {
        const leftText = leftFirst.textContent
        const rightText = rightFirst.textContent
        const {type} = leftFirst;
        const textNode = type.schema.text(leftText + rightText)!;
        actions.push(SetContentAction.create(leftFirst, [textNode]));
        if (!left.nodes[leftLength-1]) {
          const nodes = right.nodes.splice(0, rightLength).filter(identity).reverse();
          actions.push(...NodeColumn.moveNodes([leftFirst], [
            ...rightNodes.slice(1),
            ...flatten(nodes),
            ...leftNodes.slice(1)
          ]));
        } else {
          actions.push(...NodeColumn.moveNodes([leftFirst], [...rightNodes.slice(1), ...leftNodes.slice(1)]))
        }
      }
      else if (!left.nodes[leftLength-1]) {
        const nodes = right.nodes.splice(0, rightLength+1).filter(identity).reverse();
        actions.push(...NodeColumn.moveNodes(leftNodes, flatten(nodes)));
      }
      else {
        actions.push(...NodeColumn.moveNodes(leftNodes, rightNodes));
      }

      leftLength--;
      rightLength--;
    }

    return actions;
  }

  static create() {
    return new NodeColumn();
  }

  add(depth: number, nodes: Node[]) {
    this.nodes[depth] = nodes
  }

  isEmpty() {
    return !this.nodes.length;
  }

  merge(column: NodeColumn, action: 'insert' | 'move') {
    // this.nodes.push(...column.nodes);
  }
}
