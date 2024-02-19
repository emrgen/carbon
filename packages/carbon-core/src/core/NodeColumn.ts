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

    let leftLength = left.nodes.length-1;
    let rightLength = right.nodes.length-1;

    while (true) {
      const leftNodes = left.nodes[leftLength];
      const middleNodes = right.nodes[rightLength];

      if (!leftNodes || !middleNodes) {
        console.log('EMPTY LEFT', 0, rightLength+1, leftNodes)
        if (!leftNodes) {
          const leftIndex = left.nodes.findIndex(n => !isEmpty(n));
          const leftFirst = left.nodes[leftIndex]?.[0]!;
          const nodes = right.nodes.slice(0, rightLength+1).filter(identity).reverse();
          const flatNodes = flatten(nodes);
          if (!isEmpty(flatNodes)) {
            const result = NodeColumn.insertActions(leftFirst, flatNodes);
            console.log('bulk insert', leftIndex, result.before, nodes.map(ns => ns.map(n => [n.name, n.id.toString()])))
            actions.push(...result.actions);
          }
        }
        break;
      }

      if (isEmpty(leftNodes) || isEmpty(middleNodes)) {
        leftLength--;
        rightLength--;
        continue
      }

      const leftFirst = leftNodes[0];
      const middleFirst = middleNodes[0];

      if (leftFirst.isTextContainer && middleFirst.isTextContainer) {
        const nodes = middleNodes.slice(1);
        const textContent = leftFirst.textContent + middleFirst.textContent;

        if (!isEmpty(nodes)) {
          const matched = NodeColumn.insertActions(leftFirst, flatten(nodes), leftNodes.slice(1));
          actions.push(...matched.actions);
        }
      }
      else if (!left.nodes[leftLength-1]) {
        const nodes = right.nodes.slice(0, rightLength + 1).filter(identity).reverse();
        const leftFirst = leftNodes[0];
        const flatNodes = flatten(nodes);
        const result = NodeColumn.insertActions(leftFirst,flatNodes, leftNodes.slice(1));
        actions.push(...result.actions);
      }
      else {
        const firstNode = leftNodes[0];
        const at = Point.toAfter(firstNode);
        actions.push(...insertNodesActions(at, middleNodes));
      }

      leftLength--;
      rightLength--;
    }

    return actions;
  }

  // insert nodes after the before node
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

  static deleteMergeByMove(left: NodeColumn, right: NodeColumn): CarbonAction[] {
    const actions: CarbonAction[] = [];

    let rightLength = right.nodes.length-1;
    let leftLength = left.nodes.length-1;
    const matches: MoveNodesResult[] = [];
    const targets = new TargetColumn();

    while (true) {
      const leftNodes = left.nodes[leftLength]
      const rightNodes = right.nodes[rightLength]

      // when one of the columns is empty
      if (!leftNodes || !rightNodes) {
        // if left nodes are empty, move remaining right nodes to left
        if (!leftNodes) {
          const leftFirst = left.nodes.find(n => !isEmpty(n))?.[0]!;
          const nodes = right.nodes.slice(0, rightLength+1).filter(identity).reverse();
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
        // actions.push(SetContentAction.create(leftFirst, [textNode]));

        if (!left.nodes[leftLength-1]) {
          const nodes = right.nodes.slice(0, rightLength).filter(n => !isEmpty(n)).reverse();
          const moves = NodeColumn.moveNodes([leftFirst], [
            ...rightNodes.slice(1),
            ...flatten(nodes),
          ]);
          matches[leftLength] = moves;
          actions.push(...moves.actions);
          break;
        } else {
          const moves = NodeColumn.moveNodes([leftFirst], [
            ...rightNodes.slice(1),
          ], leftNodes.slice(1));

          // targets.nodes[leftLength] = {
          //   before: [leftFirst, ...rightNodes],
          //   after: leftNodes.slice(1),
          //   contentMatch: moves.contentMatch,
          // }

          matches[leftLength] = moves;
          actions.push(...moves.actions);
        }
      }
      // if the highest left node is covered already, move all the remaining right nodes to left
      else if (!left.nodes[leftLength-1]) {
        const nodes = right.nodes.slice(0, rightLength+1).filter(identity).reverse();
        const leftFirst = leftNodes[0]
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
        // targets.nodes[leftLength] = {
        //   before: [leftFirst, ...rightNodes],
        //   after: leftNodes.slice(1),
        //   contentMatch: moves.contentMatch,
        // }
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
        if (!leftNodes) {
          const nonEmptyIndex = left.nodes.findIndex(n => !isEmpty(n));
          const leftNodes = left.nodes[nonEmptyIndex] ?? [];
          const leftFirst = leftNodes[0];
          const after = (column.nodes[nonEmptyIndex] ?? []).concat(leftNodes.slice(1));
          const nodes = right.nodes.slice(0, rightIndex+1).filter(identity).reverse();
          const moves = NodeColumn.prepareMoves(leftFirst, flatten(nodes), after);
          column.append(leftIndex, moves.nodes);
        }
        break;
      }

      if (isEmpty(leftNodes) || isEmpty(rightNodes)) {
        column.append(leftIndex, []);
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
          column.append(leftIndex, []);
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
          column.append(leftIndex, []);
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
