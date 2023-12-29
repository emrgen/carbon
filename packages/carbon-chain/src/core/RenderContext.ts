import {Node, NodeId} from "@emrgen/carbon-core";
import {Optional} from "@emrgen/types";
import {createContext, getContext} from "./context";
import {VNode} from "@emrgen/carbon-react";
import {ChainComponent} from "./h";

export interface RenderStore {
  vnode(id: NodeId | HTMLElement): Optional<VNode>;
  node(id: NodeId | HTMLElement): Optional<Node>;
  element(id: NodeId): Optional<HTMLElement>;
  register(id: NodeId, vnode: VNode): void;
  unregister(id: NodeId): void;
  // register and get the component
  component(name: string, component?: ChainComponent): Optional<ChainComponent>;
  // render the content to the root element
  render(content: Node): VNode;
  mount(root: Element, content: Node): HTMLElement;
  has(id: NodeId): boolean;
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
