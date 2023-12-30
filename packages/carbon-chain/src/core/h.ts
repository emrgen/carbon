import {Node, NodeId, NodeIdSet} from "@emrgen/carbon-core";
import {identity, isArray, isEmpty, isFunction, kebabCase, range, snakeCase} from "lodash";
import {RenderContext} from "./RenderContext";
import {NodeChange, NodeChangeContext} from "./change";
import {createElement, ejectProps, injectProps} from "./createElement";
import {getContext} from "./context";
import {Optional} from "@emrgen/types";

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


// type PropType = string | number | boolean | null | undefined | Node | Node[] | (() => VNode);

interface Props extends Record<string, any> {
  node?: Node,
  ref?: (el: HTMLElement) => void;
  link?: () => Optional<Node>;
  kind?: string;

  [key: string]: ((node: Node) => any) | any;
}

type Children = (VNode | string | (() => VNode))[];

type Type = string | ((props: Props | Children, children?: Children) => VNode);

export interface VNode {
  type: Type;
  // when id is same as node id, it means the vnode is linked to the node
  // when id is different from node id, it means its a child node
  scopeId: NodeId;
  scope: Node;
  el: HTMLElement;
  props: {
    node?: Node,
    [key: string]: any;
  },
  render(): void;
  refresh(): void;
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

export const h = (type: Type, props: Props | Children, children: Children = []) => {
  if (isArray(props)) {
    children = props;
    props = {};
  }

  if (typeof type === 'function') {
    return type(props, children);
  }

  const ctx = getContext(RenderContext);
  const {node, kind, ref = identity, link, ...rest} = props || {};
  const scope = node || ctx.scope();

  for (const key in rest) {
    if (isFunction(props[key])) {
      const fn = props[key];
      if (key.startsWith('on')) {
        rest[key] = props[key] = (e: Event) => {
          const node = ctx.node(scope.id);
          fn(e, node);
        }
      }
    }
  }

  if (isEmpty(props) && isEmpty(children)) {
    return createVNode(type, {}, []);
  }

  // if node was provided, check if it is already rendered
  if (node instanceof Node && ctx.has(node.id)) {
    const vnode = ctx.vnode(node.id);
    if (vnode && vnode.scope.renderVersion === node.renderVersion) {
      console.log('[returning cached vnode]', vnode)
      return vnode;
    }
  }

  const attrs = computeProps(scope, rest)

  // create the vnode
  const vnode: VNode = {
    type,
    el: createElement(type, attrs),
    props,
    scope,
    scopeId: ctx.scopeId(),
    render() {
      render(this);
    },
    refresh() {
      refresh(this);
    },
    changed(change: NodeChange) {},
    attach() {},
    detach() {},
  }

  ctx.link(scope.id, vnode);

  // add the ref to the element
  ref(vnode.el);

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
        // get linked vnodes
        const vnodes = ctx.linked(change.node.id);
        // update the element in the dom
        vnodes?.forEach(vnode => {
          console.log(vnode.el)
          refresh(vnode);
        });
        // NOTE: some vnodes may become visible or hidden
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

const createVNode = (type: string, props: Props, children?: Children): VNode => {
  const ctx = getContext(RenderContext);
  const scope = ctx.scope();
  const vnode = {
    type,
    scope,
    scopeId: ctx.scopeId(),
    el: createElement(type, computeProps(scope, props)),
    props,
    render() {
      render(vnode);
    },
    refresh() {
      refresh(vnode);
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

  return vnode;
}

const computeProps = (node: Node, props: Props) => {
  const attrs = {};
  for (const key in props) {
    if (isFunction(props[key])) {
      const fn = props[key];
      if (key.startsWith('on')) {
        attrs[key] = fn;
        continue
      }
      attrs[kebabCase(key)] = fn(node);
      if (attrs[kebabCase(key)].length === 0) {
        delete attrs[kebabCase(key)];
      }

    } else {
      attrs[kebabCase(key)] = props[key];
    }
  }

  return attrs;
}

// handle initial render
export const render = (vnode: VNode) => {

}

const refresh = (vnode: VNode) => {
  const ctx = getContext(RenderContext);
  const node = ctx.node(vnode.scope.id);
  if (!node) {
    throw new Error(`node ${vnode.scope.id.toString()} not found`);
  }

  // update the props
  const props = vnode.props;
  const attrs = computeProps(node, props);

  // update the element props
  ejectProps(vnode.el, vnode.props);
  vnode.props = props;
  console.log('refreshing vnode', vnode.el, attrs)
  injectProps(vnode.el, attrs);
}

// handle node change events
const changed = (vnode: VNode, change: NodeChange) => {

}

const update = (vnode: VNode) => {

}


// @ts-ignore
window.range = range;
