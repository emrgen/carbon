import { Optional, Predicate, With } from "@emrgen/types";
import BTree from "sorted-btree";
import { NodeBTree } from "./BTree";
import { Node } from "./Node";
import { NodeId, NodeIdComparator } from "./NodeId";

// class NodeChainCache {
//   private _map: Map<string, number> = new Map();
//   private _parents: Map<string, Node[]> = new Map();
//   private _chain: Map<string, Node[]> = new Map();
//
//   constructor() {
//     // setTimeout(() => {
//     //   this._map = new BTree(undefined, NodeIdComparator);
//     //   this._parents = new BTree(undefined, NodeIdComparator);
//     // },5000)
//   }
//
//   index(nodeId: NodeId, root: Node, fn: (nodeId: NodeId) => number) {
//     const key = nodeId.toString();
//     if (this._map.has(key)) {
//       return this._map.get(key);
//     } else {
//       const index = fn(nodeId);
//       this._map.set(key, index);
//       return index;
//     }
//   }
//
//   parents(nodeId: NodeId, root: Node, fn: (node: NodeId) => Node[]): Node[] {
//     const key = `${root.scope.toString()}/${root.contentVersion}/${nodeId.toString()}`;
//     if (this._parents.has(key)) {
//       console.debug('parents cache hit', key);
//       return this._parents.get(key) ?? [];
//     } else {
//       const parents = fn(nodeId);
//       this._parents.set(key, parents);
//       return parents;
//     }
//   }
//
//   chain(nodeId: NodeId, root: Node, fn: (node: NodeId) => Node[]): Node[] {
//     const key = `${root.scope.toString()}/${root.contentVersion}/${nodeId.toString()}`;
//     if (this._chain.has(key)) {
//       // console.debug('chain cache hit', key);
//       return this._chain.get(key) ?? [];
//     } else {
//       const chain = fn(nodeId);
//       this._chain.set(key, chain);
//       return chain;
//     }
//   }
// }
//
// const NODE_CHAIN_CACHE = new NodeChainCache();

export interface NodeMap {
  get(key: NodeId): Optional<Node>;
  set(key: NodeId, value: Node): void;
  has(key: NodeId): boolean;
  delete(key: NodeId): void;
  forEach(fn: (value: Node, key: NodeId) => void): void;
  nodes(): Node[];
  ids(): NodeId[];
}
