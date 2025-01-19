import { Node, NodeId, NodeIdMap } from "@emrgen/carbon-core";
import { BBox, Optional } from "@emrgen/types";
import { NodeR3Tree } from "./NodeR3Tree";
import { domRectToBound, elementBound } from "./utils";

// store for nodes and their rendered HTML elements with collision detection
export class DndNodeStore {
  private rtree: NodeR3Tree = new NodeR3Tree();
  private nodeMap: NodeIdMap<Node> = new NodeIdMap();
  private elementMap: NodeIdMap<HTMLElement> = new NodeIdMap();
  private elementToNodeMap: WeakMap<HTMLElement, Node> = new WeakMap();
  private scrollPos: NodeIdMap<{ left: number; top: number }> = new NodeIdMap();

  get size() {
    return this.rtree.all().length;
  }

  collides(box: BBox): Node[] {
    return this.rtree.searchNodes(box);
  }

  clear() {
    this.rtree.clear();
    this.nodeMap.clear();
    this.elementMap.clear();
    this.elementToNodeMap = new WeakMap();
  }

  //FIXME: this is a extremely expensive operation
  // currently its happening on every render cycle
  refresh(scrollTop: number, scrollLeft: number) {
    this.rtree.clear();
    this.entries().forEach((e) => {
      // console.warn('refresh', e.node.id.toString(), e.el, elementBound(e.el!).top);
      this.rtree.add(
        e.node,
        elementBound(e.el!, { left: scrollLeft, top: scrollTop }),
      );
    });
  }

  entries() {
    return this.nodes().map((n) => ({ node: n, el: this.element(n.id) }));
  }

  private nodes() {
    return Array.from(this.nodeMap.values());
  }

  private element(id: NodeId): Optional<HTMLElement> {
    return this.elementMap.get(id);
  }

  reset() {
    debugger;
    this.nodeMap.clear();
    this.elementMap.clear();
    this.rtree.clear();
    this.elementToNodeMap = new WeakMap();
  }

  get(entry: NodeId | HTMLElement): Optional<Node> {
    if (entry instanceof NodeId) {
      return this.nodeMap.get(entry);
    } else {
      return this.elementToNodeMap.get(entry as HTMLElement);
    }
  }

  put(node: Node) {
    this.nodeMap.delete(node.id);
    this.nodeMap.set(node.id, node);
  }

  has(node: Node): boolean {
    return this.nodeMap.has(node.id);
  }

  // connect the node to the rendered HTML element
  register(node: Node, el: HTMLElement, rect?: DOMRect) {
    if (!el) {
      console.error(`Registering empty dom node for ${node.id.toString()}`);
      return;
    }

    console.log("register rtree item", node.id.toString(), el);

    const { id } = node;
    // remove old reference first
    // other part of the id will eventually be added while rendering
    this.delete(id);
    this.nodeMap.set(id, node);
    this.elementMap.set(id, el);
    this.elementToNodeMap.set(el, node);
    this.rtree.add(node, rect ? domRectToBound(rect) : elementBound(el));
  }

  // remove the node and related element,  from the store
  delete(nodeId: NodeId) {
    const el = this.elementMap.get(nodeId);
    if (el) {
      this.elementToNodeMap.delete(el);
    }

    console.log("delete rtree item", nodeId.toString(), el);

    this.nodeMap.delete(nodeId);
    this.elementMap.delete(nodeId);
    this.rtree.remove(nodeId);
  }
}
