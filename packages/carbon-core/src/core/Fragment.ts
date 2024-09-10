import { Node } from "./Node";
import { NodeId } from "./NodeId";
import { With } from "@emrgen/types";

// Fragment is a slice of adjacent nodes
export class Fragment {
  static fromNode(node: Node): Fragment {
    return Fragment.from([node]);
  }

  static EMPTY = new Fragment([]);

  static default() {
    return new Fragment([]);
  }

  static from(nodes: Node[], nodeSelection = false): Fragment {
    return new Fragment(nodes, nodeSelection);
  }

  get isEmpty() {
    return this.content.length === 0;
  }

  get nodes(): Node[] {
    return this.content;
  }

  get ids(): NodeId[] {
    return this.content.map((n) => n.id);
  }

  get childCount() {
    return this.nodes.length;
  }

  constructor(
    readonly content: Node[],
    readonly nodeSelection = false,
  ) {}

  child(index: number) {
    return this.nodes[index];
  }

  insertBefore(node: Node): Fragment {
    return Fragment.from([node, ...this.nodes]);
  }

  insertAfter(node: Node): Fragment {
    return Fragment.from([...this.nodes, node]);
  }

  destroy(): void {}

  // process each node inside the fragment
  each(fn: With<Node>) {
    this.nodes.forEach(fn);
  }

  // traverse all nodes inside the fragment
  all(fn: With<Node>) {
    this.nodes.forEach((n) =>
      n.preorder((ch) => {
        fn(ch);
        return false;
      }),
    );
  }
}

// window.Fragment = Fragment;
