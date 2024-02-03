import {CarbonAction, moveNodesActions, Node, Point, SetContentAction} from "@emrgen/carbon-core";
import {flatten, identity, isEmpty} from "lodash";

export class NodeColumn {
  nodes: Node[][] = [];

  static moveNodes(before: Node[], after: Node[]) {
    if (isEmpty(after)) {
      return []
    }
    const lastNode = before[before.length-1];
    const at = Point.toAfter(lastNode);
    return moveNodesActions(at, after)
  }

  static deleteMergeByMove(left: NodeColumn, right: NodeColumn): CarbonAction[] {
    const actions: CarbonAction[] = [];

    let rightLength = right.nodes.length-1;
    let leftLength = left.nodes.length-1;

    while (true) {
      const leftNodes = left.nodes[leftLength]
      const rightNodes = right.nodes[rightLength]

      if (!leftNodes || !rightNodes) {
        break;
      }

      if (isEmpty(leftNodes) || isEmpty(rightNodes)) {
        leftLength--;
        rightLength--;
        continue
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
          ]));
        } else {
          actions.push(...NodeColumn.moveNodes([leftFirst], [
            ...rightNodes.slice(1),
          ]))
        }
      }
      else if (!left.nodes[leftLength-1]) {
        const nodes = right.nodes.splice(0, rightLength+1).filter(identity).reverse();
        const leftFirst = leftNodes[0]
        actions.push(...NodeColumn.moveNodes([leftFirst], flatten(nodes)));
      }
      else {
        const leftFirst = leftNodes[0]
        actions.push(...NodeColumn.moveNodes([leftFirst], rightNodes));
      }

      leftLength--;
      rightLength--;
    }

    return actions;
  }

  static splitMergeByMove(left: NodeColumn, right: NodeColumn): CarbonAction[] {
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
    }

    return actions;
  }

  static collect() {}

  static create() {
    return new NodeColumn();
  }

  append(depth: number, nodes: Node[]) {
    this.nodes[depth] = this.nodes[depth] ?? []
    this.nodes[depth].push(...nodes)
  }

  prepend(depth: number, nodes: Node[]) {
    this.nodes[depth] = this.nodes[depth] ?? []
    this.nodes[depth].unshift(...nodes)
  }

  isEmpty() {
    return !this.nodes.length;
  }

  merge(column: NodeColumn, action: 'insert' | 'move') {
    // this.nodes.push(...column.nodes);
  }
}
