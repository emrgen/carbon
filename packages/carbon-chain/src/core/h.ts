import {Node} from "@emrgen/carbon-core";
import {identity, isArray, isEmpty, isEqual, isFunction, kebabCase, range} from "lodash";
import {RenderContext, RenderStore, ScopeId} from "./RenderContext";
import {NodeChange, NodeChangeContext} from "./change";
import {createElement, ejectProps, injectProps} from "./createElement";
import {getContext} from "./context";
import {Optional} from "@emrgen/types";

export type ChainComponent = (props: {node: Node}, children?: VNodeChildren) => Optional<ChainVNode>;


// const components: ChainComponent = (props: any, children?: any) => {
//   return h('div', props, children);
// }
// components.id = 'components';
// components.nodes = NodeIdSet.empty();
// components.name = 'components';


// type PropType = string | number | boolean | null | undefined | Node | Node[] | (() => VNode);

type PropLiteral = string | number | boolean | null | undefined | Node | Node[] | (() => ChainVNode) | ((el: HTMLElement) => void) | ((e: any, node: Node) => void);
type ComputedProp = (node: Node) => PropLiteral;
export type Prop = PropLiteral | ComputedProp;


export interface VNodeProps {
  node?: Node | (() => Optional<Node>);
  ref?: (el: HTMLElement) => void;
  link?: string;
  [key: string]: Prop;
}

export type VNodeChildren = (ChainVNode | string)[];

type Type = string | ((props: VNodeProps, children: VNodeChildren) => Optional<ChainVNode>);

export interface ChainVNode {
  type: Type;
  parent?: ChainVNode;
  prev?: ChainVNode;
  // when id is same as node id, it means the vnode is linked to the node
  // when id is different from node id, it means it's a child node
  oldScope?: Node; // this is a reference to the current node
  getScope(): Optional<Node>;
  scopeId?: ScopeId;
  el: HTMLElement;
  props: VNodeProps,
  render(): void;
  refresh(node: Node): void;
  changed(change: NodeChange): void;
  attach(parent: Element, after?: Element): void;
  detach(): void;
}

// NOTE: may be we can create vnode and render it later, this way we can avoid creating dom elements
// this way the dom elements will be created only when the node is visible
// this will also allow us to create the dom elements in the background
// and then replace the old dom elements with the new ones
// more over, this will allow to call changed handler on the returned vnode within the node rendering context
// assuming the returned vnode is the one responsible for rendering the node in the dom along with its children

export const h = (type: Type, props: VNodeProps | VNodeChildren, children: VNodeChildren = []) => {
  // props can be children
  if (isArray(props)) {
    children = props as unknown as VNodeChildren;
    props = {};
  }

  // type can be a component
  if (typeof type === 'function') {
    return type(props, children);
  }

  // if props and children are empty, create an empty vnode
  if (isEmpty(props) && isEmpty(children)) {
    return createVNode(type, {}, []);
  }

  const ctx = getContext(RenderContext);
  const {node, ref = identity, link, ...rest} = props || {};

  const scope = ctx.scope();

  const preparedProps = prepareProps(ctx, scope, rest);
  const vnode = createVNode(type, preparedProps, children);
  // add the ref to the element
  ref(vnode.el);

  // console.log(type, scope)
  vnode.getScope = () => {
    if (!node) {
      return ctx.node(scope.id);
    }

    if (isFunction(node)) {
      return node();
    } else {
      return node;
    }
  };

  const scopeId = ScopeId.from(scope.id, link);
  ctx.link(scopeId, vnode);
  vnode.scopeId = scopeId;
  vnode.oldScope = scope;

  // add the children to the element
  children.forEach(child => {
    if (typeof child === 'string') {
      vnode.el.appendChild(document.createTextNode(child));
    } else {
      vnode.el.appendChild(child.el);
    }
  });

  return vnode;
}


const createVNode = (type: string, props: VNodeProps, children?: VNodeChildren): ChainVNode => {
  const ctx = getContext(RenderContext);
  const scope = ctx.scope();
  const vnode = {
    type,
    el: createElement(type, computeProps(scope, props)),
    props,
    render() {
      render(vnode);
    },
    getScope: identity,
    refresh(node: Node) {
      refresh(node, vnode);
    },
    changed(change: NodeChange) {
      changed(vnode, change)
    },
    attach(parent: Element, after?: Element) {
      // insert the element to the parent at the index
      if (after) {
        parent.insertBefore(vnode.el, after);
      } else {
        parent.appendChild(vnode.el);
      }
      // add the node to the store
      ctx.register(scope.id, vnode);
    },
    detach() {
      // remove the element from the dom
      vnode.el.remove();
      ejectProps(vnode.el, vnode.props);
      // remove the node from the store
      ctx.unregister(scope.id);
    },
  }

  watch(ctx, scope, vnode)

  return vnode;
}


// const xxx = () => {
//   // listen to node changes and update the dom
//   if (node instanceof Node) {
//     const cm = getContext(NodeChangeContext);
//     const update = (change: NodeChange) => {
//       // if node is removed, remove the element from the dom
//       if (change.type === 'remove') {
//         const vnode = ctx.vnode(change.node.id);
//         if (!vnode) {
//           throw new Error(`VNode for node ${change.node.id.toString()} not found`);
//         }
//
//         // remove the element from the dom
//         vnode.el.remove();
//         ejectProps(vnode.el, vnode.props);
//         // remove the node from the store
//         ctx.unregister(node.id);
//         cm.unsubscribe(node.id, update);
//
//         console.log('removing node', change.node.id.toString());
//         return
//       }
//
//       // if a child node is added, add the element to the dom
//       if (change.type === 'add:child') {
//         const component = ctx.component(change.node.name);
//         if (!component) {
//           throw new Error(`Component ${change.node.name} not found`);
//         }
//         // create a child vnode
//         const childVnode = component(change.node);
//         // insert the element to the parent at the index
//         const children = vnode.el.children || [];
//         vnode.el.insertBefore(childVnode.el, children[change.offset ?? change.parent?.size ?? 0]);
//         ctx.register(change.node.id, childVnode);
//         return
//       }
//
//       // if node is updated, update the element in the dom
//       if (change.type === 'update') {
//         // get linked vnodes
//         const vnodes = ctx.linked(change.node.id);
//         // update the element in the dom
//         vnodes?.forEach(vnode => {
//           console.log(vnode.el)
//           refresh(vnode);
//         });
//         // NOTE: some vnodes may become visible or hidden
//         // update the node in the store
//         return
//       }
//
//       console.log('unprocessed node change', change);
//     }
//
//     cm.subscribe(node.id, update);
//   }
// }

const watch = (ctx: RenderStore, node: Node, vnode: ChainVNode) => {
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
      // const childVnode = component(change.node);
      // // insert the element to the parent at the index
      // const children = vnode.el.children || [];
      // vnode.el.insertBefore(childVnode.el, children[change.offset ?? change.parent?.size ?? 0]);
      // ctx.register(change.node.id, childVnode);
      return
    }

    // if node is updated, update the element in the dom
    if (change.type === 'update') {
      // get linked vnodes
      const vnodes = ctx.linked(change.node.id);

      console.log('updating node', change.node.id.toString(), vnodes.map(v => [v, v.scopeId?.toString()]));
      // update the element in the dom
      vnodes?.forEach(vnode => {
        refresh(change.node, vnode);
      });
      return
    }

    console.log('unprocessed node change', change);
  }
  cm.unsubscribeAll(node.id);
  cm.subscribe(node.id, update);
}

const unwatch = (ctx: RenderStore, node: Node, vnode: ChainVNode) => {

}

const prepareProps = (ctx: RenderStore, scope: Node, props: VNodeProps) => {
  const attrs = {};
  for (const key in props) {
    if (isFunction(props[key])) {
      const fn = props[key] as any
      if (key.startsWith('on')) {
        attrs[key] = (e: any) => {
          const node = ctx.node(scope.id);
          return fn(e, node);
        };
        continue
      }

      attrs[kebabCase(key)] = fn
    } else {
      attrs[kebabCase(key)] = props[key];
    }
  }

  return attrs;
}

const computeProps = (scope: Node, props: VNodeProps) => {
  const attrs = {};
  for (const key in props) {
    if (isFunction(props[key])) {
      const fn = props[key] as any
      if (key.startsWith('on')) {
        attrs[key] = fn;
      } else {
        attrs[key] = fn(scope);
        if (isEmpty(attrs[key])) {
          delete attrs[key];
        }
      }
    } else {
      attrs[key] = props[key];
    }
  }

  return attrs;
}

// handle initial render
export const render = (vnode: ChainVNode) => {

}

const refresh = (scope: Node, vnode: ChainVNode) => {
  console.log('refreshing vnode', vnode.el, vnode.props)

  // update the props
  const props = vnode.props;
  const attrs = computeProps(scope, props);

  if (isEqual(props, attrs)) {
    return;
  }

  // update the element props
  ejectProps(vnode.el, vnode.props);
  console.log('refreshing vnode', vnode.el, attrs)
  injectProps(vnode.el, attrs);
}

// handle node change events
const changed = (vnode: ChainVNode, change: NodeChange) => {

}

const update = (vnode: ChainVNode) => {

}


// @ts-ignore
window.range = range;
