import {Node, NodeId} from "@emrgen/carbon-core";
import {Optional} from "@emrgen/types";
import {createContext, getContext} from "./context";
import {ChainComponent} from "./h";
import {VNode} from './h';

export interface RenderStore {
  vnode(id: NodeId | HTMLElement, kind?: string): Optional<VNode>;
  node(id: NodeId | HTMLElement): Optional<Node>;
  element(id: NodeId): Optional<HTMLElement>;
  register(id: NodeId, vnode: VNode): void;
  unregister(id: NodeId): void;
  // all the components in the same scope are linked to the same node
  // this is used to re-render the node components when the node changes
  scope(): Node;
  scopeId(): NodeId;
  link(id: NodeId, vnode: VNode): void;
  unlink(id: NodeId, vnode: VNode): void;
  linked(id: NodeId): Optional<VNode[]>;
  // register and get the component
  component(name: string, component?: ChainComponent): Optional<ChainComponent>;
  // render the content to the root element
  render(content: Node): VNode;
  mount(root: Element, content: Node): HTMLElement;
  has(id: NodeId, kind?: string): boolean;
}

export const RenderContext = createContext<RenderStore>({
  vnode: () => {
    throw new Error('not implemented');
  },
  node: () => {
    throw new Error('not implemented');
  },
  element: () => {
    throw new Error('not implemented');
  },
  register: () => {
    throw new Error('not implemented');
  },
  unregister: () => {
    throw new Error('not implemented');
  },
  scope: (): Node => {
    throw new Error('not implemented');
  },
  scopeId: (): NodeId => {
    throw new Error('not implemented');
  },
  link: () => {
    throw new Error('not implemented');
  },
  unlink: () => {
    throw new Error('not implemented');
  },
  linked: () => {
    throw new Error('not implemented');
  },
  component: (name: string, component?: ChainComponent): Optional<ChainComponent> => {
    throw new Error('not implemented');
  },
  render: (content: Node): VNode => {
    throw new Error('not implemented');
  },
  mount: (root: HTMLElement, content: Node) => {
    throw new Error('not implemented');
  },
  has: (id: NodeId): boolean => {
    throw new Error('not implemented');
  }
});
