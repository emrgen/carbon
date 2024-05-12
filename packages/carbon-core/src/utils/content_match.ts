import { Fragment, Node, Point } from "@emrgen/carbon-core";
import { ContentMatch } from "../core/ContentMatch";
import { first } from "lodash";

export const getContentMatch = (node: Node) => {
  const parent = node.parent!;
  const matchNodes = parent.children.slice(0, node.index + 1) ?? [];
  return parent.type.contentMatch.matchFragment(Fragment.from(matchNodes))!;
};

export interface MatchResult {
  match: ContentMatch | null;
  validEnd: boolean;
}

export interface MatchAction {
  at: Point;
  node: Node;
}

// TODO: optimize this function
// find a valid end for content match with the given nodes and after nodes
// if the nodes can not make progress, try to unwrap the nodes and check if the children can make progress
export const findMatchingActions = (
  actions: MatchAction[],
  contentMatch: ContentMatch,
  at: Point,
  nodes: Node[],
  after: Node[],
): MatchResult => {
  // debugger
  if (nodes.length === 0) {
    const nextMatch = contentMatch.matchFragment(Fragment.from(after));
    return {
      match: contentMatch,
      validEnd: !!nextMatch?.validEnd,
    };
  }

  const node = first(nodes) as Node;
  if (node.isTextContainer) {
    return {
      match: null,
      validEnd: false,
    };
  }

  // if the node can add to contentMatch without unwrapping
  let currMatch = contentMatch.matchFragment(Fragment.from([node]));
  if (currMatch) {
    console.log("match", node.name, node.id.toString(), currMatch);
    actions.push({ at, node });
    const result = findMatchingActions(
      actions,
      currMatch,
      Point.toAfter(node),
      nodes.slice(1),
      after,
    );
    if (result.validEnd) {
      return result;
    } else {
      actions.pop();
    }
  }

  // try with unwrapping the node
  return findMatchingActions(
    actions,
    contentMatch,
    at,
    node.children.concat(nodes.slice(1)),
    after,
  );
};

export const findMatchingNodes = (
  before: Node[],
  contentMatch: ContentMatch,
  nodes: Node[],
  after: Node[],
): MatchResult => {
  if (nodes.length === 0) {
    const nextMatch = contentMatch.matchFragment(Fragment.from(after));
    return {
      match: contentMatch,
      validEnd: !!nextMatch?.validEnd,
    };
  }

  const node = first(nodes) as Node;
  if (node.isTextContainer) {
    return {
      match: null,
      validEnd: false,
    };
  }

  const currMatch = contentMatch.matchFragment(Fragment.from([node]));
  if (currMatch) {
    before.push(node);
    const result = findMatchingNodes(before, currMatch, nodes.slice(1), after);
    if (result.validEnd) {
      return result;
    } else {
      before.pop();
    }
  }

  return findMatchingNodes(
    before,
    contentMatch,
    node.children.concat(nodes.slice(1)),
    after,
  );
};
