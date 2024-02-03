import {
  CarbonAction, findMatchingActions,
  Fragment,
  getContentMatch, InsertNodeAction, MatchAction, MoveNodeAction,
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

  static moveNodes(before: Node[], after: Node[]) {
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
