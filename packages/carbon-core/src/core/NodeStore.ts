import { Optional } from "@emrgen/types";
import { NodeId } from "./NodeId";
import { Node } from "./Node";
import { clamp } from "lodash";
import { Carbon } from "./Carbon";
import { NodeMap } from "./NodeMap";

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

  get(entry: NodeId | HTMLElement | Element): Optional<Node> {
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
    // console.log("registering", node.id.toString(), el);
    const { id: nodeId } = node;
    const { id } = nodeId;
    // remove old reference first
    // other part of the id will eventually be added while rendering
    this.delete(node);

    this.elementMap.set(id.toString(), el);
    this.elementToNodeMap.set(el, node);
  }

  // remove the node from the store
  delete(from: Node | NodeId) {
    const id = (from instanceof Node ? from.id : from).toString();
    const el = this.elementMap.get(id.toString());
    if (el) {
      this.elementToNodeMap.delete(el);
    }

    this.elementMap.delete(id.toString());
  }

  // resolve the node from the HTML element
  resolve(el: any, offset: number): { node: Optional<Node>; offset: number } {
    if (!el) return { node: null, offset };
    let node: Optional<Node>;

    // if el is a text node
    // if (el.nodeType === document.TEXT_NODE) {
    //   console.log("text node", el);
    // }
    //
    do {
      node = this.elementToNodeMap.get(el);
      // if el is a text node and no carbon node is found
      // then check if prev or next node is a carbon node
      if (
        !node &&
        el.nodeType === 1 &&
        el.tagName === "SPAN" &&
        el.textContent == "\n"
      ) {
        const prev = el.previousSibling;
        if (prev) {
          node = this.elementToNodeMap.get(prev);
          if (node) {
            offset = node.textContent.length;
            break;
          }
        }

        const next = el.nextSibling;
        if (next) {
          node = this.elementToNodeMap.get(next);
          if (node) {
            offset = 0;
            break;
          }
        }
      }

      if (node) {
        // debugger;
        break;
      } else {
        // debugger;
        el = el.parentNode;
      }
    } while (el);

    if (!node) {
      return { node: null, offset };
    }

    const cnode = this.nodeMap.get(node.id);
    // console.log(el, cnode);
    // if (cnode?.isInlineAtom) {
    //   debugger;
    // }

    if (el.nodeType === 3) {
      offset = clamp(offset, 0, el.textContent.length);
    }

    return {
      node: cnode,
      offset,
    };
  }

  clear() {
    this.elementMap.clear();
    this.elementToNodeMap = new WeakMap();
  }
}
