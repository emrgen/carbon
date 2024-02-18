import {
  CarbonAction, findMatchingActions,
  Fragment,
  getContentMatch, InsertNodeAction, insertNodesActions, MatchAction, MoveNodeAction,
  moveNodesActions,
  Node, nodeLocation,
  Point, RemoveNodeAction, removeNodesActions,
  SetContentAction
} from "@emrgen/carbon-core";
import {flatten, identity, isEmpty, last} from "lodash";
import {ContentMatch} from "./ContentMatch";
import {Optional} from "@emrgen/types";
import {takeBefore} from "../utils/array";

interface MoveNodesResult {
  actions: CarbonAction[];
  contentMatch: Optional<ContentMatch>;
}

interface PasteEntry {
  before: Node[];
  after: Node[];
  contentMatch: Optional<ContentMatch>;
}

class PasteColumn {
  nodes: PasteEntry[] = [];
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

  // ALGORITHM
  // 1. insert the slice nodes
  //   - if the left node is a text node and the right node is a text node
  //     - merge the text nodes
  // 2. move the right nodes wrt slice end node
  //
  static pasteActions(left: NodeColumn, middle: NodeColumn, right: NodeColumn) {
    const actions: CarbonAction[] = [];

    let leftLength = left.nodes.length-1;
    let rightLength = right.nodes.length-1;
    let middleLength = middle.nodes.length-1;
    const matches = new PasteColumn();


    while (true) {
      const leftNodes = left.nodes[leftLength];
      const middleNodes = middle.nodes[middleLength];

      if (!leftNodes || !middleNodes) {
        console.log('EMPTY LEFT', 0, middleLength+1, leftNodes)
        if (!leftNodes) {
          const leftIndex = left.nodes.findIndex(n => !isEmpty(n));
          const leftFirst = left.nodes[leftIndex]?.[0]!;
          const nodes = middle.nodes.slice(0, middleLength+1).filter(identity).reverse();
          const flatNodes = flatten(nodes);
          if (!isEmpty(flatNodes)) {
            const result = NodeColumn.insertActions(leftFirst, flatNodes);
            console.log('bulk insert', leftIndex, result.before, nodes.map(ns => ns.map(n => [n.name, n.id.toString()])))
            matches.nodes[leftIndex] = result;
            actions.push(...result.actions);
          }
        }
        break;
      }

      if (isEmpty(leftNodes) || isEmpty(middleNodes)) {
        leftLength--;
        middleLength--;
        continue
      }

      const leftFirst = leftNodes[0];
      const middleFirst = middleNodes[0];

      if (leftFirst.isTextContainer && middleFirst.isTextContainer) {
        const nodes = middleNodes.slice(1);
        const textContent = leftFirst.textContent + middleFirst.textContent;
        const textNode = leftFirst.type.schema.text(textContent)!;
        actions.push(SetContentAction.create(leftFirst, [textNode]));

        if (!isEmpty(nodes)) {
          const matched = NodeColumn.insertActions(leftFirst, flatten(nodes), leftNodes.slice(1));
          matches.nodes[leftLength] = matched;
          actions.push(...matched.actions);
        } else {
          matches.nodes[leftLength] = {
            contentMatch: getContentMatch(leftFirst),
            before: [leftFirst],
            after: leftNodes.slice(1),
          }
        }
      }
      else if (!left.nodes[leftLength-1]) {
        // console.log('', 0, middleLength + 1)
        const nodes = middle.nodes.slice(0, middleLength + 1).filter(identity).reverse();
        const leftFirst = leftNodes[0];
        // console.log('nodes', nodes.map(ns => ns.map(n => [n.name, n.id.toString()])))
        const result = NodeColumn.insertActions(leftFirst, flatten(nodes), leftNodes.slice(1));
        matches.nodes[leftLength] = result;
        actions.push(...result.actions);
      }
      else {
        const firstNode = leftNodes[0];
        const at = Point.toAfter(firstNode);
        actions.push(...insertNodesActions(at, middleNodes));
        matches.nodes[leftLength] = {
          contentMatch: getContentMatch(firstNode),
          before: [firstNode, ...middleNodes],
          after: leftNodes.slice(1),
        }
      }

      leftLength--;
      middleLength--;
    }

    const lastLevel = matches.nodes.findIndex(n => n && !isEmpty(n.before));
    console.log('lastLevel', lastLevel, matches.nodes.map(n => n?.before.map(n => [n.name, n.textContent])))
    const sliceEndParent = last(matches.nodes[lastLevel]?.before);
    if (!sliceEndParent) {
      throw new Error('failed to find slice end parent');
    }

    const sliceEndTitle = sliceEndParent?.find(n => n.isTextContainer, {
      order: 'post',
      direction: 'backward'
    });

    const chain = takeBefore(sliceEndTitle?.chain ?? [], n => n.eq(sliceEndParent));
    console.log('chain', chain.map(n => [n.name, n.id.toString()]))

    chain.reverse().forEach((node, i) => {
      matches.nodes[lastLevel + i + 1] = {
        contentMatch: getContentMatch(node),
        before: [node],
        after: []
      }
    })

    console.log('last level', lastLevel, matches.nodes, sliceEndTitle?.name, sliceEndTitle?.textContent)

    // const matches: MoveNodesResult[] = [];

    // move the nodes after selection end to the end of the inserted nodes
    {
      let leftIndex = lastLevel + chain.length;
      let rightIndex = right.nodes.length-1;

      while (true) {
        const leftEntry = matches.nodes[leftIndex];
        const rightNodes = right.nodes[rightIndex];

        // all the moves are done after the leftLast node
        const leftLast = last(leftEntry?.before);
        const rightFirst = rightNodes[0];

        if (!leftLast || !rightFirst) {
          break;
        }

        if (leftLast.isTextContainer && rightFirst.isTextContainer) {
          const leftText = leftLast.textContent;
          const rightText = rightFirst.textContent;
          const textContent = leftText + rightText;
          const textNode = leftLast.type.schema.text(textContent)!;
          actions.push(SetContentAction.create(leftLast, [textNode]));
          // actions.push(RemoveNodeAction.fromNode(nodeLocation(rightFirst)!, rightFirst.id));

          if (rightNodes.length > 1) {
            const nodes = rightNodes.slice(1);
            const matched = NodeColumn.moveActions(leftEntry.contentMatch!, leftLast, nodes, leftEntry.after);
            actions.push(...matched);
          }

          console.log('remaining nodes', rightNodes.slice(1).map(n => [n.name, n.id.toString()]))
        }
        else {
          // const matched = NodeColumn.moveActions(leftLast, rightNodes);
          // actions.push(...matched);
        }

        leftIndex--;
        rightIndex--;

        break;
      }
    }

    return actions;
  }

  // insert nodes after the before node
  static insertActions(before: Node, nodes: Node[], after: Node[] = []) {
    const at = Point.toAfter(before);
    const contentMatch = getContentMatch(before);
    const match = contentMatch.matchFragment(Fragment.from(nodes));

    const actions = insertNodesActions(at, nodes)

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
