import { Optional } from "@emrgen/types";
import { NodeId } from "./NodeId";
import { Node } from "./Node";
import { Carbon, NodeMap } from "@emrgen/carbon-core";

// NodeStore is a store for the nodes and their rendered HTML elements
export class NodeStore {
  private elementMap: Map<string, HTMLElement> = new Map();
  private elementToNodeMap: WeakMap<HTMLElement, Node> = new WeakMap();

  constructor(private readonly app: Carbon) {}

  get nodeMap(): NodeMap {
    return this.app.state.nodeMap;
  }

  elements() {
    return Array.from(this.elementMap.values());
  }

  get(entry: NodeId | HTMLElement): Optional<Node> {
    const nodeId = entry;
    if (nodeId instanceof NodeId) {
      return this.nodeMap.get(nodeId);
    } else {
      return this.elementToNodeMap.get(entry as HTMLElement);
    }
  }

  // get the rendered HTML element for the node
  element(nodeId: NodeId): Optional<HTMLElement> {
    const el = this.elementMap.get(nodeId.id);
    if (el) {
      return el;
    }

    // expensive operation but should be called when the node is not in the store yet
    const domEl = document.querySelector(
      `[data-id="${nodeId.toString()}"]`,
    ) as HTMLElement;
    const node = this.get(nodeId);
    if (domEl && node) {
      this.register(node, domEl);
    }

    console.error(
      `NodeStore.element: element not found for ${nodeId.toString()}`,
    );
    return domEl;
  }

  // connect the node to the rendered HTML element
  register(node: Node, el: Optional<HTMLElement>) {
    if (!el) {
      console.error(`Registering empty dom node for ${node.id.toString()}`);
      return;
    }
    const { id: nodeId } = node;
    const { id } = nodeId;
    // remove old reference first
    // other part of the id will eventually be added while rendering
    this.delete(node);

    this.elementMap.set(id, el);
    this.elementToNodeMap.set(el, node);
  }

  // remove the node from the store
  delete(from: Node | NodeId) {
    const id = (from instanceof Node ? from.id : from).toString();
    const el = this.elementMap.get(id);
    if (el) {
      this.elementToNodeMap.delete(el);
    }

    this.elementMap.delete(id);
  }

  // resolve the node from the HTML element
  resolve(el: any): Optional<Node> {
    if (!el) return;
    let node: Optional<Node>;

    do {
      node = this.elementToNodeMap.get(el);
      if (node) {
        break;
      } else {
        el = el.parentNode;
      }
    } while (el);

    if (!node) {
      return null;
    }

    return this.nodeMap.get(node.id);
  }

  clear() {
    this.elementMap.clear();
    this.elementToNodeMap = new WeakMap();
  }
}
