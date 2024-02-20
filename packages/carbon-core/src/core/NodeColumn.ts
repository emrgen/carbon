import {
  CarbonAction, findMatchingActions, findMatchingNodes,
  Fragment,
  getContentMatch, InsertNodeAction, insertNodesActions, MatchAction, MatchResult, MoveNodeAction,
  moveNodesActions,
  Node, nodeLocation,
  Point, RemoveNodeAction, removeNodesActions,
  SetContentAction
} from "@emrgen/carbon-core";
import {flatten, get, identity, isEmpty, last} from "lodash";
import {ContentMatch} from "./ContentMatch";
import {Optional} from "@emrgen/types";
import {takeBefore} from "../utils/array";

interface MoveNodesResult {
  actions: CarbonAction[];
  contentMatch: Optional<ContentMatch>;
}

interface TargetEntry {
  before: Node[];
  after: Node[];
  contentMatch: MatchResult;
}

class TargetColumn {
  nodes: TargetEntry[] = [];
}

export class NodeColumn {
  nodes: Node[][] = [];

  private static moveNodes(before: Node[], nodes: Node[], after: Node[] = []) {
    if (isEmpty(nodes)) {
      return {
        actions: [],
        contentMatch: null,
      }
    }
    const lastNode = before[before.length-1];
    const at = Point.toAfter(lastNode);
    const contentMatch = getContentMatch(lastNode);
    const matchActions: MatchAction[] = [];
    const matches = findMatchingActions(matchActions, contentMatch, at, nodes, []);
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

  // insert the slice nodes
  // NOTE: only works for case 1 and 2
  // https://www.notion.so/paste-so-many-damn-cases-f7ef4f8160034836b6eafdcd92589486
  static pasteActionsEasy(left: NodeColumn, right: NodeColumn) {
    const actions: CarbonAction[] = [];
    const nodes: Node[][] = [];

    let leftLength = left.nodes.length-1;
    let rightLength = right.nodes.length-1;

    while (true) {
      const leftNodes = left.nodes[leftLength];
      const rightNodes = right.nodes[rightLength];

      if (!rightNodes) {
        break;
      }

      if (isEmpty(leftNodes) || isEmpty(rightNodes)) {
        leftLength--;
        rightLength--;
        continue
      }

      const leftFirst = leftNodes[0];
      const rightFirst = rightNodes[0];

       if (!left.nodes[leftLength-1]) {
        const nodes = right.nodes.slice(0, rightLength + 1).filter(identity).reverse();
        const flatNodes = flatten(nodes);
        const result = NodeColumn.insertActions(leftFirst, flatNodes, leftNodes.slice(1));
        actions.push(...result.actions);
        nodes[leftLength] = flatNodes;
      }
      else {
        const at = Point.toAfter(leftFirst);
        actions.push(...insertNodesActions(at, rightNodes));
         nodes[leftLength] = rightNodes;
      }

      leftLength--;
      rightLength--;
    }

    console.log('nodes', nodes);

    return actions;
  }

  // insert nodes after the before node with valid content matching
  static insertActions(before: Node, nodes: Node[], after: Node[] = []): TargetEntry & {actions: CarbonAction[]}{
    const at = Point.toAfter(before);
    const contentMatch = getContentMatch(before);
    const matches: Node[] = [];
    const match = findMatchingNodes(matches, contentMatch, nodes, after);
    const actions = insertNodesActions(at, matches)

    return {
      actions,
      contentMatch: match,
      before: [before, ...nodes],
      after: after,
    }
  }

  static moveActions(contentMatch: ContentMatch, before: Node, nodes: Node[], after: Node[] = []) {
    const matchActions: MatchAction[] = [];

    const at = Point.toAfter(before);
    const matches = findMatchingActions(matchActions, contentMatch, at, nodes, []);
    if (!matches.match) {
      throw new Error('failed to find a valid end');
    }

    if (!matches.match.validEnd) {
      throw new Error('failed to find a valid end');
    }

    return matchActions.map(m => MoveNodeAction.create(nodeLocation(m.node)!, m.at, m.node.id));
  }

  // merge left and right column by moving nodes from right to left
  static mergeByMove(left: NodeColumn, right: NodeColumn): CarbonAction[] {
    const actions: CarbonAction[] = [];

    let rightLength = right.nodes.length-1;
    let leftLength = left.nodes.length-1;
    const matches: MoveNodesResult[] = [];

    while (true) {
      const leftNodes = left.nodes[leftLength]
      const rightNodes = right.nodes[rightLength]

      if (!rightNodes || !leftNodes) {
        // when left column is consumed fully but there are still nodes in right column
        if (!leftNodes) {
          const leftFirst = left.nodes.find(n => !isEmpty(n))?.[0]!;
          const nodes = right.nodes.slice(0, rightLength+1).filter(e => !isEmpty(e)).reverse();
          if (!isEmpty(nodes)) {
            const moves = NodeColumn.moveNodes([leftFirst], flatten(nodes));
            actions.push(...moves.actions);
          }
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
      // current level is the top most left level
      if (!left.nodes[leftLength-1]) {
        const nodes = right.nodes.slice(0, rightLength+1).filter(identity).reverse();
        const moves = NodeColumn.moveNodes([leftFirst], flatten(nodes), leftNodes.slice(1));
        // failed to find a valid end try with higher left node
        if (!moves.contentMatch?.validEnd) {
          leftLength--;
          continue
        }
        matches[leftLength] = moves;
        actions.push(...moves.actions);
        break;
      }
      // current level is not the top most left level
      else {
        const moves = NodeColumn.moveNodes([leftFirst], rightNodes, leftNodes.slice(1));
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

    if (!yes) {
      throw new Error('failed to find a valid end for all moves');
    }

    return actions;
  }

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
