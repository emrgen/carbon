import {Node} from "@emrgen/carbon-core";
import {flatten, isEmpty, range} from "lodash";
import {NodeStore, NodeStoreContext} from "./store";
import {NodeChange, NodeChangeContext} from "./change";
import {createElement} from "./createElement";
import {getContext} from "./context";

// interface ChainNode {
//   type: string;
//   // el: HTMLElement;
//   props?: {
//     node?: Node,
//     [key: string]: any;
//   },
//   children: ChainNode[];
//   update: (props: any) => void;
// }


type Type = string | ((props: any) => VNode);

interface VNode {
  type: Type;
  el?: HTMLElement | null;
  props: {
    node?: Node,
    [key: string]: any;
  },
}


export const h = (type: Type, props, children: VNode[] = []) => {

  if (typeof type === 'function') {
    return type(props);
  }

   // if () {
   //  children = props;
   //  props = {};
  // }

  const vnode: VNode = {
    type,
    el: null,
    props,
  }

  const {node, ...rest} = props || {};
  const store = getContext(NodeStoreContext).getValue();
  // listen to node changes and update the dom
  if (node instanceof Node) {
    const cm = getContext(NodeChangeContext).getValue();
    const update = (change: NodeChange) => {
      // if node is removed, remove the element from the dom
      if (change.type === 'remove') {
        // remove the element from the dom
        vnode.el?.remove();
        // remove the node from the store
        store.unregister(node);
        vnode.el = null;
        cm.unsubscribe(node.id, update);
      }

      // if a child node is added, add the element to the dom
      if (change.type === 'add:child') {
        // add the element to the dom
        // create the element
        const el = createElement(node.type, rest);
        // insert the element to the parent at the index
        const children = vnode.el?.children || [];
        vnode.el?.insertBefore(el, children[change.index]);
        // add the node to the store
        store.register(node, el);
        vnode.el = el;
      }

      // if node is updated, update the element in the dom
      if (change.type === 'update') {
        // update the element in the dom
        // update the props of the element
        // update the node in the store
      }
    }

    cm.subscribe(node.id, update);
  }

  // create the element
  const el = createElement(type, rest);
  // add the node to the store
  if (node instanceof Node) {
    store.register(node, el);
  }

  // add the children to the element
  children.forEach(child => {
    if (child.el) {
      el.appendChild(child.el);
    }
  });

  vnode.el = el;

  return vnode;
}


// @ts-ignore
window.range = range;
