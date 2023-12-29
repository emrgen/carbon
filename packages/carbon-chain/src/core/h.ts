import {Node, NodeIdSet} from "@emrgen/carbon-core";
import {isArray, isEmpty, range} from "lodash";
import {RenderContext} from "./RenderContext";
import {NodeChange, NodeChangeContext} from "./change";
import {createElement, ejectProps} from "./createElement";
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

export interface ChainComponent {
  (props: any): VNode;
  id: string;
  // keep track of the nodes that are using this component
  nodes: NodeIdSet;
  component: string;
}

// const components: ChainComponent = (props: any, children?: any) => {
//   return h('div', props, children);
// }
// components.id = 'components';
// components.nodes = NodeIdSet.empty();
// components.name = 'components';


type Props = {
  node?: Node,
  [key: string]: any;
}

type Children = (VNode | string | (() => VNode))[];

type Type = string | ((props: Props | Children, children?: Children) => VNode);

interface VNode {
  type: Type;
  // attach the function which created this vnode,
// so that we can call it again to update the vnode internally
  creator?: (props: Props | Children, children?: Children) => VNode;
  el: HTMLElement;
  props: {
    node?: Node,
    [key: string]: any;
  },
}

export const h = (type: Type, props: Props | Children, children: Children = []) => {
  if (isArray(props)) {
    children = props;
    props = {};
  }

  if (typeof type === 'function') {
    return type(props, children);
  }

  if (isEmpty(props) && isEmpty(children)) {
    return {
      type,
      el: createElement(type, {}),
      props: {},
    }
  }

   // if () {
   //  children = props;
   //  props = {};
  // }

  const ctx = getContext(RenderContext);
  const {node, ...rest} = props || {};

  if (node) {
    // console.log('checking vnode cache', node.id, ctx.has(node.id))
  }

  if (node instanceof Node && ctx.has(node.id)) {
    const vnode = ctx.vnode(node.id);
    if (vnode && vnode.props.node.renderVersion === node.renderVersion) {
      console.log('[returning cached vnode]', vnode)
      return vnode;
    }
  }

  // create the vnode
  const vnode: VNode = {
    type,
    el: createElement(type, rest),
    props,
  }

  // add the node to the store
  if (node instanceof Node) {
    ctx.register(node.id, vnode);
  }

  // listen to node changes and update the dom
  if (node instanceof Node) {
    const cm = getContext(NodeChangeContext);
    const update = (change: NodeChange) => {
      // if node is removed, remove the element from the dom
      if (change.type === 'remove') {
        const vnode = ctx.vnode(change.node.id);
        if (!vnode) {
          throw new Error(`VNode for node ${change.node.id.toString()} not found`);
        }

        // remove the element from the dom
        vnode.el.remove();
        ejectProps(vnode.el, vnode.props);
        // remove the node from the store
        ctx.unregister(node.id);
        cm.unsubscribe(node.id, update);

        console.log('removing node', change.node.id.toString());
        return
      }

      // if a child node is added, add the element to the dom
      if (change.type === 'add:child') {
        const component = ctx.component(change.node.name);
        if (!component) {
          throw new Error(`Component ${change.node.name} not found`);
        }
        // create a child vnode
        const childVnode = component(change.node);
        // insert the element to the parent at the index
        const children = vnode.el.children || [];
        vnode.el.insertBefore(childVnode.el, children[change.offset ?? change.parent?.size ?? 0]);
        ctx.register(change.node.id, childVnode);
        return
      }

      // if node is updated, update the element in the dom
      if (change.type === 'update') {
        // update the element in the dom
        // update the props of the element
        // update the node in the store
        return
      }

      console.log('unprocessed node change', change);
    }

    cm.subscribe(node.id, update);
  }

  // add the children to the element
  children.forEach(child => {
    if (typeof child === 'string') {
      vnode.el.appendChild(document.createTextNode(child));
    } else if (typeof child === 'function') {
      // avoid calling child() multiple times
      const childVnode = child();
      vnode.el.appendChild(childVnode.el);
    } else {
      vnode.el.appendChild(child.el);
    }
  });

  return vnode;
}

export const render = (vnode: VNode, container: HTMLElement) => {
  container.appendChild(vnode.el);
}


// @ts-ignore
window.range = range;
