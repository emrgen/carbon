import { Optional } from "@emrgen/types";
import { flatten, identity, isEmpty, last } from "lodash";
import { insertNodesActions } from "../utils/action";
import {
  findMatchingActions,
  findMatchingNodes,
  getContentMatch,
  MatchAction,
} from "../utils/content_match";
import { nodeLocation } from "../utils/location";
import { CarbonAction, MoveNodeAction } from "./actions/index";
import { ContentMatch } from "./ContentMatch";
import { Node } from "./Node";
import { Point } from "./Point";

interface MoveNodesResult {
  actions: CarbonAction[];
  contentMatch: Optional<ContentMatch>;
}

interface TargetEntry {
  before: Node[];
  after: Node[];
  contentMatch: ContentMatch;
  used: boolean;
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
      };
    }
    const lastNode = before[before.length - 1];
    const at = Point.toAfter(lastNode);
    const contentMatch = getContentMatch(lastNode);
    const matchActions: MatchAction[] = [];
    const matches = findMatchingActions(
      matchActions,
      contentMatch,
      at,
      nodes,
      [],
    );
    return {
      actions: matchActions.map((m) =>
        MoveNodeAction.create(nodeLocation(m.node)!, m.at, m.node.id),
      ),
      contentMatch: matches.match,
    };
  }

  private static prepareMoves(before: Node, nodes: Node[], after: Node[]) {
    if (isEmpty(nodes) && isEmpty(after)) {
      return {
        nodes: [],
        contentMatch: null,
      };
    }

    const at = Point.toAfter(before);
    const contentMatch = getContentMatch(before);
    const matchActions: MatchAction[] = [];
    const matches = findMatchingActions(
      matchActions,
      contentMatch,
      at,
      nodes,
      after,
    );
    return {
      nodes: matchActions.map((m) => m.node),
      contentMatch: matches.match,
    };
  }

  // insert the slice of nodes
  // NOTE: only works for case 1 and 2
  // https://www.notion.so/paste-so-many-damn-cases-f7ef4f8160034836b6eafdcd92589486
  // connect left nodes with right nodes
  static pasteInsertActions(
    left: NodeColumn,
    right: NodeColumn,
  ): {
    actions: CarbonAction[];
    targets: TargetColumn;
  } {
    const insertActions: CarbonAction[] = [];
    const nodes: Node[][] = [];

    let leftLength = left.nodes.length - 1;
    let rightLength = right.nodes.length - 1;
    const targets: TargetColumn = new TargetColumn();
    left.nodes.forEach((leftNodes, index) => {
      targets.nodes[index] = {
        before: leftNodes.slice(0, 1),
        after: leftNodes.slice(1),
        contentMatch: getContentMatch(leftNodes[0]),
        used: false,
      };
    });

    console.log("targets", targets);

    while (true) {
      const leftNodes = left.nodes[leftLength];
      const rightNodes = right.nodes[rightLength];
      console.log(
        "leftNodes",
        leftLength,
        !left.nodes[leftLength - 1],
        leftNodes,
      );

      if (!leftNodes) {
        const nodes = right.nodes
          .slice(0, rightLength + 1)
          .filter((e) => !isEmpty(e))
          .reverse();
        if (isEmpty(nodes)) {
          break;
        }

        // when left column is consumed fully but there are still nodes in right column
        const siblingIndex = targets.nodes.findIndex(
          (n) => n && !isEmpty(n.before),
        );
        const siblings = targets.nodes[siblingIndex];
        if (!siblings) {
          throw new Error("failed to find siblings");
        }

        const { before, after, contentMatch } = siblings;
        const match = NodeColumn.insertActionWithMatch(
          before,
          contentMatch,
          flatten(nodes),
          after,
        );
        if (!match.validEnd) {
          throw new Error("failed to find a valid end");
        }

        insertActions.push(...match.actions);
        targets.nodes[siblingIndex] = {
          before: match.before,
          contentMatch: match.contentMatch!,
          after: match.after,
          used: true,
        };
        break;
      }

      if (!rightNodes) {
        break;
      }

      if (isEmpty(leftNodes) || isEmpty(rightNodes)) {
        leftLength--;
        rightLength--;
        continue;
      }

      const leftFirst = leftNodes[0];

      // current level is the top most left level
      if (!left.nodes[leftLength - 1]) {
        const nodes = right.nodes
          .slice(0, rightLength + 1)
          .filter(identity)
          .reverse();
        const flatNodes = flatten(nodes);
        const { actions, before, after, contentMatch, validEnd } =
          NodeColumn.insertActions(leftFirst, flatNodes, leftNodes.slice(1));
        if (!validEnd) {
          throw new Error("failed to find a valid end");
        }
        insertActions.push(...actions);
        targets.nodes[leftLength] = {
          before: before,
          after: after,
          contentMatch: contentMatch!,
          used: true,
        };
        break;
      } else {
        const at = Point.toAfter(leftFirst);
        const { actions, before, after, contentMatch, validEnd } =
          NodeColumn.insertActions(leftFirst, rightNodes, leftNodes.slice(1));
        if (!validEnd) {
          leftLength--;
          continue;
        }

        insertActions.push(...actions);
        targets.nodes[leftLength] = {
          before: before,
          after: after,
          contentMatch: contentMatch!,
          used: true,
        };
      }

      leftLength--;
      rightLength--;
    }

    console.log("nodes", nodes);

    return {
      actions: insertActions,
      targets,
    };
  }

  static pasteMoveActions(
    targets: TargetColumn,
    right: NodeColumn,
  ): CarbonAction[] {
    const moveActions: CarbonAction[] = [];

    let leftLength = targets.nodes.length - 1;
    while (isEmpty(targets.nodes[leftLength]?.before)) {
      leftLength--;
    }

    let rightLength = right.nodes.length - 1;

    const moveTargets: TargetColumn = new TargetColumn();
    // copy targets to moveTargets, this is required for collapse right when no merge was done before target is consumed
    targets.nodes.forEach((target, index) => {
      moveTargets.nodes[index] = {
        before: target.before,
        after: target.after,
        contentMatch: target.contentMatch,
        used: false,
      };
    });

    while (true) {
      const { before, after, contentMatch, used } =
        targets.nodes[leftLength] ?? {};
      const rightNodes = right.nodes[rightLength];

      if (isEmpty(before)) {
        console.log("COLLAPSE RIGHT", rightLength);
        const nodes = right.nodes
          .slice(0, rightLength + 1)
          .filter((e) => !isEmpty(e))
          .reverse();
        if (isEmpty(nodes)) {
          break;
        }

        // when left column is consumed fully but there are still nodes in right column
        const siblingIndex = moveTargets.nodes.findIndex(
          (n) => n && !isEmpty(n.before),
        );
        const siblings = targets.nodes[siblingIndex];
        if (!siblings) {
          throw new Error("failed to find siblings");
        }

        const { before, after, contentMatch } = siblings;
        const match = NodeColumn.moveActions(
          contentMatch,
          last(before)!,
          flatten(nodes),
          after,
        );
        if (!match.validEnd) {
          throw new Error("failed to find a valid end");
        }

        moveActions.push(...match.actions);
        break;
      }

      if (!rightNodes) {
        break;
      }

      if (isEmpty(before) || isEmpty(rightNodes)) {
        leftLength--;
        rightLength--;
        continue;
      }

      const leftFirst = last(before)!;
      if (isEmpty(targets.nodes[leftLength - 1]?.before)) {
        const nodes = right.nodes
          .slice(0, rightLength + 1)
          .filter((e) => !isEmpty(e))
          .reverse();
        const flatNodes = flatten(nodes);
        const matches = NodeColumn.moveActions(
          contentMatch,
          leftFirst,
          flatNodes,
          after,
        );
        if (!matches.validEnd) {
          leftLength--;
          continue;
        }

        moveActions.push(...matches.actions);
        moveTargets.nodes[leftLength] = {
          before: [...before, ...flatNodes],
          after: after,
          contentMatch: contentMatch!,
          used: true,
        };
        break;
      } else {
        const matches = NodeColumn.moveActions(
          contentMatch,
          leftFirst,
          rightNodes,
          after,
        );
        if (!matches?.validEnd) {
          leftLength--;
          continue;
        }
        moveActions.push(...matches.actions);
        moveTargets.nodes[leftLength] = {
          before: [...before, ...rightNodes],
          after: after,
          contentMatch: contentMatch!,
          used: true,
        };
      }

      leftLength--;
      rightLength--;
    }

    return moveActions;
  }

  // insert nodes after the before node with valid content matching
  static insertActions(
    before: Node,
    nodes: Node[],
    after: Node[] = [],
  ): {
    actions: CarbonAction[];
    validEnd: boolean;
    contentMatch: Optional<ContentMatch>;
    before: Node[];
    after: Node[];
  } {
    const at = Point.toAfter(before);
    const contentMatch = getContentMatch(before);
    if (!contentMatch) {
      throw Error("failed to get content match fro before nodes");
    }
    const matches: Node[] = [];
    const match = findMatchingNodes(matches, contentMatch, nodes, after);
    const actions = insertNodesActions(at, matches);

    return {
      actions,
      validEnd: match.validEnd,
      contentMatch: match.match,
      before: [before, ...nodes],
      after: after,
    };
  }

  static insertActionWithMatch(
    before: Node[],
    contentMatch: ContentMatch,
    nodes: Node[],
    after: Node[] = [],
  ) {
    const at = Point.toAfter(last(before)!);
    const matches: Node[] = [];
    const match = findMatchingNodes(matches, contentMatch, nodes, after);
    const actions = insertNodesActions(at, matches);

    return {
      actions,
      validEnd: match.validEnd,
      contentMatch: match.match,
      before: matches,
      after: after,
    };
  }

  static moveActions(
    contentMatch: ContentMatch,
    before: Node,
    nodes: Node[],
    after: Node[] = [],
  ) {
    const matchActions: MatchAction[] = [];

    const at = Point.toAfter(before);
    const matches = findMatchingActions(
      matchActions,
      contentMatch,
      at,
      nodes,
      [],
    );
    if (!matches.match) {
      throw new Error("failed to find a match for move");
    }

    if (!matches.match.validEnd) {
      throw new Error("failed to find a valid end for move");
    }

    return {
      contentMatch: matches.match,
      validEnd: matches.match.validEnd,
      actions: matchActions.map((m) =>
        MoveNodeAction.create(nodeLocation(m.node)!, m.at, m.node.id),
      ),
    };
  }

  // merge left and right column by moving nodes from right to left
  static mergeByMove(left: NodeColumn, right: NodeColumn): CarbonAction[] {
    const actions: CarbonAction[] = [];

    let rightLength = right.nodes.length - 1;
    let leftLength = left.nodes.length - 1;
    const matches: MoveNodesResult[] = [];

    while (true) {
      const leftNodes = left.nodes[leftLength];
      const rightNodes = right.nodes[rightLength];

      if (!leftNodes) {
        // when left column is consumed fully but there are still nodes in right column
        const leftFirst = left.nodes.find((n) => !isEmpty(n))?.[0]!;
        const nodes = right.nodes
          .slice(0, rightLength + 1)
          .filter((e) => !isEmpty(e))
          .reverse();
        if (!isEmpty(nodes)) {
          const moves = NodeColumn.moveNodes([leftFirst], flatten(nodes));
          actions.push(...moves.actions);
        }
        break;
      }

      if (!rightNodes) {
        break;
      }

      //
      if (isEmpty(leftNodes) || isEmpty(rightNodes)) {
        leftLength--;
        rightLength--;
        continue;
      }

      const leftFirst = leftNodes[0];
      // current level is the top most left level
      if (!left.nodes[leftLength - 1]) {
        const nodes = right.nodes
          .slice(0, rightLength + 1)
          .filter(identity)
          .reverse();
        const moves = NodeColumn.moveNodes(
          [leftFirst],
          flatten(nodes),
          leftNodes.slice(1),
        );
        // failed to find a valid end try with higher left node
        if (!moves.contentMatch?.validEnd) {
          leftLength--;
          continue;
        }
        matches[leftLength] = moves;
        actions.push(...moves.actions);
        break;
      }
      // current level is not the top most left level
      else {
        const moves = NodeColumn.moveNodes(
          [leftFirst],
          rightNodes,
          leftNodes.slice(1),
        );
        // failed to find a valid end try with higher left node
        if (!moves.contentMatch?.validEnd) {
          leftLength--;
          continue;
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
      throw new Error("failed to find a valid end for all moves");
    }

    return actions;
  }

  static create() {
    return new NodeColumn();
  }

  append(depth: number, nodes: Node[]) {
    this.nodes[depth] = this.nodes[depth] ?? [];
    this.nodes[depth].push(...nodes);
  }

  prepend(depth: number, nodes: Node[]) {
    this.nodes[depth] = this.nodes[depth] ?? [];
    this.nodes[depth].unshift(...nodes);
  }

  isEmpty() {
    return !this.nodes.length;
  }

  merge(column: NodeColumn, action: "insert" | "move") {
    // this.nodes.push(...column.nodes);
  }
}
