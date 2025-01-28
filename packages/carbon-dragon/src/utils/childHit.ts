import { Node } from "@emrgen/carbon-core";
import { Optional, Predicate } from "@emrgen/types";
import { LRUCache } from "lru-cache";
import { NodeStore } from "packages/carbon-core";
import { elementBound } from "../core/index";
import { nodeFromPoint } from "./hit";

const cache = new LRUCache({
  max: 50,
  maxSize: 100,
  sizeCalculation: (value, key) => {
    return 1;
  },
});

export const isDragHitNode = (n: Node) => {
  return (n.isContainer && !!n.parent?.type.dnd?.container) || !!n.type.dnd?.container;
};

export const childHit = (
  store: NodeStore,
  parent: Node,
  node: Node,
  x,
  y,
  pred: Predicate<Node>,
): Optional<Node> => {
  // TODO: cache the page container element for one drag event cycle to avoid multiple lookups
  const docEl = store.element(parent.id)!;
  const rect = elementBound(docEl);
  const style = window.getComputedStyle(docEl) ?? {};
  const padding = parseInt(style.paddingLeft) || 0;
  let found: Optional<Node> = parent;
  let onLeft = false,
    onRight = false;

  // check if the cursor is in the left padding area of the page
  if (found.isPage) {
    if (rect.left < x && x < rect.left + padding) {
      x = rect.left + padding + 20;
      found = nodeFromPoint(store, x, y, isDragHitNode) ?? found;
      onLeft = true;
    }
  }

  // check if the cursor is in the right padding area of the page
  if (found?.isPage) {
    if (rect.right - padding < x && x < rect.right) {
      x = rect.right - padding - 20;
      found = nodeFromPoint(store, x, y, isDragHitNode) ?? found;
      onRight = true;
    }
  }

  // the axis the
  // search along the y-axis
  if (found?.isPage) {
    found = searchDown(store, parent, x, y) ?? searchUp(store, parent, x, y) ?? found;
  }

  // search along the x-axis
  if (found?.isPage) {
    found = searchLeft(store, parent, x, y) ?? searchRight(store, parent, x, y) ?? found;
  }

  return found?.eq(parent) ? null : found;
};

// search for the nearest node above the cursor
function searchUp(store: NodeStore, parent: Node, x: number, y: number) {
  for (let dy = 5; dy < 200 && y + dy > 0; dy += 5) {
    const n = nodeFromPoint(store, x, y - dy, isDragHitNode);
    if (n && !n.eq(parent)) {
      return n;
    }
  }
}

// TODO: there are other better way to do this, but for now, this is fine
// search for the nearest node below the cursor
function searchDown(store: NodeStore, parent: Node, x: number, y: number) {
  for (let dy = 5; dy < 500; dy += 5) {
    const n = nodeFromPoint(store, x, y + dy, isDragHitNode);
    if (n && !n.eq(parent)) {
      return n;
    }
  }
}

// search for the nearest node to the left of the cursor
function searchLeft(store: NodeStore, parent: Node, x: number, y: number) {
  for (let dx = 5; dx < 100 && dx + x > 0; dx += 5) {
    const n = nodeFromPoint(store, x - dx, y, isDragHitNode);
    if (n && !n.eq(parent)) {
      return n;
    }
  }
}

// search for the nearest node to the right of the cursor
function searchRight(store: NodeStore, parent: Node, x: number, y: number) {
  for (let dx = 5; dx < 100; dx += 5) {
    const n = nodeFromPoint(store, x + dx, y, isDragHitNode);
    if (n && !n.eq(parent)) {
      return n;
    }
  }
}
