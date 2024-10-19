import { Node } from "../core/Node";
import { Point } from "../core/Point";
import { zip } from "lodash";
import { NodeStore } from "../core/NodeStore";
import { Optional } from "@emrgen/types";

export function nodesBetweenPoints(
  tail: Point,
  head: Point,
  store: NodeStore,
): Node[] {
  const nodes = [];

  return nodes;
}

// returns immediate children of commonNode
export function blocksBelowCommonNode(
  startNode: Node,
  endNode: Node,
): [Node, Node] {
  // calculate inputs
  const tailChain = startNode.chain.filter((n) => n.isBlock);
  const headChain = endNode.chain.filter((n) => n.isBlock);
  const commonChainLen = Math.min(headChain.length, tailChain.length);
  const chain = zip(tailChain.reverse(), headChain.reverse()).slice(
    0,
    commonChainLen,
  );
  const [prev, next] =
    chain.find(([prev, next], index) => {
      // ensures prev/next always exists
      if (chain.length === index + 1) return true;
      return !prev?.eq(next!);
    }) ?? ([] as Optional<Node>[]);

  return [prev, next] as [Node, Node];
}

export const nodesBelowCommonNode = (
  startNode: Node,
  endNode: Node,
): [Node, Node] => {
  const startChain = startNode.chain;
  const endChain = endNode.chain;
  const commonChainLen = Math.min(startChain.length, endChain.length);
  const chain = zip(startChain.reverse(), endChain.reverse()).slice(
    0,
    commonChainLen,
  );
  const [prev, next] = chain.find(([prev, next], index) => {
    if (chain.length === index + 1) return true;
    return !prev?.eq(next!);
  }) as [Node, Node];

  return [prev, next];
};
