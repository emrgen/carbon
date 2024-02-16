import {
  CarbonAction, findMatchingActions,
  Fragment,
  getContentMatch, InsertNodeAction, insertNodesActions, MatchAction, MoveNodeAction,
  moveNodesActions,
  Node, nodeLocation,
  Point,
  SetContentAction
} from "@emrgen/carbon-core";
import {flatten, identity, isEmpty} from "lodash";
import {ContentMatch} from "./ContentMatch";
import {Optional} from "@emrgen/types";

interface MoveNodesResult {
  actions: CarbonAction[];
  contentMatch: Optional<ContentMatch>;
}

export class NodeColumn {
  nodes: Node[][] = [];

  private static moveNodes(before: Node[], after: Node[]) {
    if (isEmpty(after)) {
      return {
        actions: [],
        contentMatch: null,
      }
    }
    const lastNode = before[before.length-1];
    const at = Point.toAfter(lastNode);
    const contentMatch = getContentMatch(lastNode);
    const matchActions: MatchAction[] = [];
    const matches = findMatchingActions(matchActions, contentMatch, at, after, []);
    return {
      actions: matchActions.map(m => MoveNodeAction.create(nodeLocation(m.node)!, m.at, m.node.id)),
      contentMatch: matches.match,
    }
  }

  private static prepareMoves(before: Node, nodes: Node[], after: Node[]) {
    if (isEmpty(nodes) && isEmpty(after)) {
      return {
        nodes: [],
        contentMatch: null,
      }
    }

    const at = Point.toAfter(before);
    const contentMatch = getContentMatch(before);
    const matchActions: MatchAction[] = [];
    const matches = findMatchingActions(matchActions, contentMatch, at, nodes, after);
    return {
      nodes: matchActions.map(m => m.node),
      contentMatch: matches.match,
    }
  }

  static insertActions(leftNodes: NodeColumn, rightNodes: NodeColumn) {
    if (isEmpty(rightNodes.nodes)) {
      return [];
    }

    if (leftNodes.nodes.length !== rightNodes.nodes.length) {
      return []
    }

    let rightLength = rightNodes.nodes.length-1;
    let leftLength = leftNodes.nodes.length-1;
    const actions: CarbonAction[] = [];

    while (true) {
      const left = leftNodes.nodes[leftLength];
      const right = rightNodes.nodes[rightLength];

      if (!left || !right) {
        break;
      }

      const leftFirst = left[0];
      const rightFirst = right[0];

      if (leftFirst.isTextContainer && rightFirst.isTextContainer) {
        // const moves = NodeColumn.moveNodes(left, right);
        // actions.push(...moves.actions);
      }
      else if (!isEmpty(right) && !isEmpty(left)) {
        const firstNode = left[0];
        const at = Point.toAfter(firstNode);
        actions.push(...insertNodesActions(at, right));
      }

      leftLength--;
      rightLength--;
    }

    return actions;
  }

  static moveActions(after: Node, nodes: Node[]) {
    // const at = Point.toAfter(after);
    // const contentMatch = getContentMatch(after);
    // const matchActions: MatchAction[] = [];
    // const matches = findMatchingActions(matchActions, contentMatch, at, nodes, []);
    // return matchActions.map(m => InsertNodeAction.create(m.at, m.node));

    return [];
  }

  static deleteMergeByMove(left: NodeColumn, right: NodeColumn): CarbonAction[] {
    const actions: CarbonAction[] = [];

    let rightLength = right.nodes.length-1;
    let leftLength = left.nodes.length-1;
    const matches: MoveNodesResult[] = [];

    while (true) {
      const leftNodes = left.nodes[leftLength]
      const rightNodes = right.nodes[rightLength]

      // when one of the columns is empty
      if (!leftNodes || !rightNodes) {
        // if left nodes are empty, move remaining right nodes to left
        if (!leftNodes) {
          const leftFirst = left.nodes.find(n => !isEmpty(n))?.[0]!;
          const nodes = right.nodes.splice(0, rightLength+1).filter(identity).reverse();
          const moves = NodeColumn.moveNodes([leftFirst], flatten(nodes));
          matches[leftLength] = moves;
          actions.push(...moves.actions);
        }

        break;
      }

      //
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
          const moves = NodeColumn.moveNodes([leftFirst], [
            ...rightNodes.slice(1),
            ...flatten(nodes),
          ]);
          matches[leftLength] = moves;
          actions.push(...moves.actions);
        } else {
          const moves = NodeColumn.moveNodes([leftFirst], [
            ...rightNodes.slice(1),
          ])
          matches[leftLength] = moves;
          actions.push(...moves.actions);
        }
      }
      // if the highest left node is covered already, move all the remaining right nodes to left
      else if (!left.nodes[leftLength-1]) {
        const nodes = right.nodes.splice(0, rightLength+1).filter(identity).reverse();
        const leftFirst = leftNodes[0]
        const moves = NodeColumn.moveNodes([leftFirst], flatten(nodes));
        // failed to find a valid end try with higher left node
        if (!moves.contentMatch?.validEnd) {
          leftLength--;
          continue
        }
        matches[leftLength] = moves;
        actions.push(...moves.actions);
        break;
      }
      else {
        const leftFirst = leftNodes[0]
        const moves = NodeColumn.moveNodes([leftFirst], rightNodes);
        // failed to find a valid end try with higher left node
        if (!moves.contentMatch?.validEnd) {
          leftLength--;
          continue
        }
        matches[leftLength] = moves;
        actions.push(...moves.actions);
        console.log('xxxxx', leftFirst.name, leftFirst.id.toString(), rightNodes.map(n => n.name))
      }

      leftLength--;
      rightLength--;
    }

    const yes = matches.every((match, index) => {
      if (match.actions.length === 0) {
        return true;
      }
      return !!match.contentMatch?.validEnd;
    });

    console.log(yes)

    return actions;
  }

  static preparePlacement(left: NodeColumn, right: NodeColumn): NodeColumn {
    const column = NodeColumn.create();
    let rightIndex = right.nodes.length-1;
    let leftIndex = left.nodes.length-1;

    while (true) {
      const leftNodes = left.nodes[leftIndex]
      const rightNodes = right.nodes[rightIndex]

      if (!leftNodes || !rightNodes) {
        if (leftNodes) {
          const nonEmptyIndex = left.nodes.findIndex(n => !isEmpty(n));
          const leftNodes = left.nodes[nonEmptyIndex] ?? [];
          const leftFirst = leftNodes[0];
          const after = (column.nodes[nonEmptyIndex] ?? []).concat(leftNodes.slice(1));
          const nodes = right.nodes.splice(0, rightIndex+1).filter(identity).reverse();
          const moves = NodeColumn.prepareMoves(leftFirst, flatten(nodes), after);
          column.append(leftIndex, moves.nodes);
        }
        break;
      }

      if (isEmpty(leftNodes) || isEmpty(rightNodes)) {
        leftIndex--;
        rightIndex--;
        continue
      }

      const leftFirst = leftNodes[0];
      const rightFirst = rightNodes[0];

      if (leftFirst.isTextContainer && rightFirst.isTextContainer) {
        const moves = NodeColumn.prepareMoves(leftFirst, rightNodes.slice(1), leftNodes.slice(1));
        if (moves.nodes.length && !moves.contentMatch?.validEnd) {
          throw new Error('failed to find a valid end');
        }

        column.append(leftIndex, [rightFirst, ...moves.nodes]);
      }
      // if the highest left node is covered already, move all the remaining right nodes to left
      else if (!left.nodes[leftIndex-1]) {
        const nodes = right.nodes.splice(0, rightIndex+1).filter(identity).reverse();
        const leftFirst = leftNodes[0]
        const moves = NodeColumn.prepareMoves(leftFirst, flatten(nodes), leftNodes.splice(1));
        // failed to find a valid end
        // try with higher left node
        if (!moves.contentMatch?.validEnd) {
          leftIndex--;
          continue
        }
        column.append(leftIndex, moves.nodes);
        break;
      }
      //
      else {
        const leftFirst = leftNodes[0]
        const moves = NodeColumn.prepareMoves(leftFirst, rightNodes, leftNodes.slice(1));
        // failed to find a valid end
        // try with higher left node
        if (!moves.contentMatch?.validEnd) {
          leftIndex--;
          continue
        }
        column.append(leftIndex, moves.nodes);
      }

      leftIndex--;
      rightIndex--;
    }

    return column;
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
