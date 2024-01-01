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
  ref?: (el: any) => void;
  link?: string;
  [key: string]: Prop;
}

export type VNodeChildren = (ChainVNode | string)[];

type Type = string | ((props: VNodeProps, children: VNodeChildren) => Optional<ChainVNode>);

export interface ChainVNode {
  type: Type;
  parent?: ChainVNode;
  prev?: ChainVNode;
  next?: ChainVNode;
  children?: ChainVNode[];
  // when id is same as node id, it means the vnode is linked to the node
  // when id is different from node id, it means it's a child node
  scopeNode?: Node; // this is a reference to the current node
  getScopeNode(): Optional<Node>;
  scopeId?: ScopeId;
  el: Element;
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

  const ctx = getContext(RenderContext);
  const {node, ref = identity, link, ...rest} = props || {};
  const scope = ctx.scope();

  const getScopeNode = () => {
    if (!node) {
      return ctx.node(scope.id);
    }

    if (isFunction(node)) {
      return node();
    } else {
      return node;
    }
  };

  // this is a virtual node that is not visible in the dom
  // when the children are rendered, they will be added to the parent vnode
  // when a child is added to a empty link fragment, the child will be added to the previous sibling
  // if the previous sibling is not available, the child will be added to the parent vnode that has el(linkFragment does not have el)
  if (type === 'link') {
    const vnodeChildren = prepareChildren(children);
    const linkFragment = {
      type: 'link',
      children: vnodeChildren,
      getScopeNode: getScopeNode,
      scopeNode: scope,
      scopeId: ScopeId.from(scope.id, link),
    } as ChainVNode;

    vnodeChildren.forEach(child => {
      child.parent = linkFragment;
    });

    return linkFragment;
  }

  // if props and children are empty, create an empty vnode
  if (isEmpty(props) && isEmpty(children)) {
    return createVNode(type, {}, []);
  }

  const preparedProps = prepareProps(ctx, scope, rest);
  const vnodeChildren =prepareChildren(children);

  const vnode = createVNode(type, preparedProps, vnodeChildren);
  // add the ref to the element
  ref(vnode.el);

  // console.log(type, scope)
  vnode.getScopeNode = getScopeNode;

  const scopeId = ScopeId.from(scope.id, link);
  ctx.link(scopeId, vnode);
  vnode.scopeId = scopeId;
  vnode.scopeNode = scope;

  let prev: ChainVNode | undefined;
  // add the children to the element
  vnodeChildren.forEach(child => {
    vnode.el.appendChild(child.el);
    if (prev) {
      prev.next = child;
    }
    child.prev = prev;
    prev = child;
  });

  return vnode;
}

const prepareChildren = (children: VNodeChildren) => {
  return children.map(child => {
    if (typeof child === 'string') {
      return {
        type: 'text',
        el: createElement('text', child),
      } as ChainVNode;
    } else {
      return child;
    }
  });
}


const createVNode = (type: string, props: VNodeProps, children: ChainVNode[]): ChainVNode => {
  const ctx = getContext(RenderContext);
  const scope = ctx.scope();
  const vnode: ChainVNode = {
    type,
    el: createElement(type, computeProps(scope, props)),
    props,
    render() {
      render(vnode);
    },
    getScopeNode: identity,
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
      if (vnode.el instanceof HTMLElement) {
        ejectProps(vnode.el, vnode.props);
      }
      // remove the node from the store
      ctx.unregister(scope.id);
    },
  }


  // add children to the parent vnode
  children.forEach(child => {
    child.parent = vnode;
  });
  vnode.children = children;

  watch(ctx, scope, vnode)

  return vnode;
}

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
      const childVnode = component({node: change.node})!;
      // insert the element to the parent at the index
      const children = vnode.el.children || [];
      vnode.el.insertBefore(childVnode.el, children[change.offset ?? change.parent?.size ?? 0]);
      ctx.register(change.node.id, childVnode);
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
  // console.log('refreshing vnode', vnode.el, vnode.props)

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
