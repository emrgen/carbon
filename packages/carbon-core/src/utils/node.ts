import { Node } from "../core";
import { takeBefore, takeUpto } from './array';

export const nodePath = (start: Node, end: Node) => {
  const commonNode = start.commonNode(end);
  return takeUpto(start.chain, n => n.eq(commonNode)).concat(takeBefore(end.chain, n => n.eq(commonNode)));
}

export const hasParent = (node: Node, parent: Node) => {
  return node.chain.some(n => n.eq(parent));
}

