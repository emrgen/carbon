import {Node, NodeBTree, NodeId, NodeIdComparator, Schema} from "@emrgen/carbon-core";
import BTree from "sorted-btree";

// maintain a runtime schema of the current document
// each draft have its own runtime schema which originates from the document schema

// runtime schema is cow (copy on write) and is updated on each node insertion/removal
// content matcher is used to validate the document
export class ContentMatcher {
  private parent: ContentMatcher | undefined;

  private nodes: BTree<NodeId, string> = new BTree(undefined, NodeIdComparator);

  constructor(readonly schema: Schema) {

  }

  insert(nodeId: NodeId) {
    // this.nodes.set(node.id, node.type);
  }

  remove(nodeId: NodeId) {
    // this.nodes.delete(node.id);
  }

  validate(nodeId: NodeId) {}
}
