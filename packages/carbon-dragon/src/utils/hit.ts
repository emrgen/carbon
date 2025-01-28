import { Node, NodeStore } from "@emrgen/carbon-core";
import { Optional, Predicate } from "@emrgen/types";

// find bottom most node under the cursor, that satisfies the predicate
export const nodeFromPoint = (
  store: NodeStore,
  x: number,
  y: number,
  predicate: Predicate<Node>,
): Optional<Node> => {
  const hits = document.elementsFromPoint(x, y);
  let found: Optional<Node>;

  // find the first node that satisfies the predicate
  for (const el of hits) {
    const node = store.get(el);
    if (node && predicate(node)) {
      found = node;
      break;
    }
  }

  return found;
};

// find list of nodes under the cursor, that satisfies the predicate
// the nodes are ordered from bottom to top, i.e. the first node is the bottom most node
export const nodesFromPoint = (
  store: NodeStore,
  x: number,
  y: number,
  predicate: Predicate<Node>,
): Node[] => {
  const hits = document.elementsFromPoint(x, y);
  const nodes: Node[] = [];

  // find the nodes that satisfy the predicate
  for (const el of hits) {
    const node = store.get(el);
    if (node && predicate(node)) {
      nodes.push(node);
    }
  }

  return nodes;
};
