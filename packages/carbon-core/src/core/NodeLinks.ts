import { Node } from "./Node";
import { Optional } from "@emrgen/types";
import { NodeId } from "./NodeId";
import { Maps } from "./types";

export class NodeLinks {
  nodes: Map<string, Node>;
  frozen: boolean;

  constructor() {
    this.nodes = new Map();
    this.frozen = false;
  }

  link(name: string, node: Node) {
    if (node.frozen) {
      throw new Error("Cannot link frozen node");
    }

    node.linkName = name;
    this.nodes.set(node.linkName, node);
  }

  unlink(name: string): Optional<Node> {
    const node = this.nodes.get(name);
    this.nodes.delete(name);
    return node;
  }

  setParent(parent: Node) {
    if (this.frozen) {
      return;
    }

    for (let node of this.nodes.values()) {
      node.setParent(parent);
    }
  }

  setParentId(parentId: NodeId) {
    if (this.frozen) {
      return;
    }

    for (let node of this.nodes.values()) {
      node.setParentId(parentId);
    }
  }

  clone(map: Maps<Node, Node>) {
    const clone = new NodeLinks();
    for (let [name, node] of this.nodes) {
      const clonedNode = node.clone(map);
      clone.link(name, clonedNode);
    }

    return clone;
  }

  freeze() {
    this.frozen = true;
  }
}
