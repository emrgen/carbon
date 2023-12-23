import { Node } from "../core";
import { takeBefore, takeUpto } from './array';

export const nodePath = (start: Node, end: Node) => {
  const commonNode = start.commonNode(end);
  return takeUpto(start.chain, n => n.eq(commonNode)).concat(takeBefore(end.chain, n => n.eq(commonNode)));
}

export const hasParent = (node: Node, parent: Node) => {
  return node.chain.some(n => n.eq(parent));
}

export type NodeSorter = (a: Node, b: Node) => number;
export type SortNodesBy = 'path' | 'depth' | 'type' | 'index' | NodeSorter;
const NodeNullSorter: NodeSorter = (a, b) => 0;

export const sortNodes = (nodes: Node[], by: SortNodesBy = NodeNullSorter): Node[] => {
  switch (by) {
    case 'path':
      return sortNodesByPath(nodes);
    case 'depth':
      return sortNodesByDepth(nodes);
    case 'index':
      return sortNodesByIndex(nodes);
    default:
      return nodes.sort(by as NodeSorter);
  }
}

export const sortNodesByIndex = (nodes: Node[]): Node[] => {
  const paths = nodes.map(n => ({
    node: n,
    index: n.index,
  }));

  paths.sort((a, b) => {
    if (a.index < b.index) {
      return -1;
    }

    if (a.index > b.index) {
      return 1;
    }

    return 0;
  });

  return paths.map(p => p.node);

}

export const sortNodesByDepth = (nodes: Node[]): Node[] => {
  const paths = nodes.map(n => ({
    node: n,
    depth: n.depth,
  }));

  paths.sort((a, b) => {
    if (a.depth < b.depth) {
      return -1;
    }

    if (a.depth > b.depth) {
      return 1;
    }

    return 0;
  });

  return paths.map(p => p.node);
}

// TODO: optimize this
export const sortNodesByPath = (nodes: Node[]): Node[] => {
  const paths = nodes.map(n => ({
    node: n,
    path: n.path,
  }));

  paths.sort((a, b) => {
    const aPath = a.path;
    const bPath = b.path;
    for (let i = 0, size = Math.min(aPath.length, bPath.length); i < size; i++) {
      if (aPath[i] < bPath[i]) {
        return -1;
      }

      if (aPath[i] > bPath[i]) {
        return 1;
      }
    }

    if (aPath.length < bPath.length) {
      return -1;
    }

    if (aPath.length > bPath.length) {
      return 1;
    }

    return 0;
  });

  return paths.map(p => p.node);
}


export const isIsolatedNodes = (a: Node, b: Node): boolean => {
  const aIsolate = a.closest(n => n.isIsolate)!
  const bIsolate = b.closest(n => n.isIsolate)!

  return !aIsolate.eq(bIsolate)
}
