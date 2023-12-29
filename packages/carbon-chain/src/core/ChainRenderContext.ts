import {RenderStore} from "./RenderContext";
import {ChainComponent} from "@emrgen/carbon-chain";
import {Optional} from "@emrgen/types";
import {Node, NodeId, NodeIdSet} from "@emrgen/carbon-core";
import {VNode} from "@emrgen/carbon-react";
import BTree from 'sorted-btree';
import {v4 as uuidv4} from 'uuid';

export class ChainRenderContext extends BTree<NodeId, VNode> implements RenderStore {
  private components: Map<string, ChainComponent> = new Map<string, ChainComponent>();

  component(name: string, component?: ChainComponent): Optional<ChainComponent> {
    if (component) {
      component.id = uuidv4();
      component.component = name;
      component.id = uuidv4();
      component.nodes = NodeIdSet.empty();

      this.components.set(name, component);
    }

    return this.components.get(name);
  }

  node(id: NodeId | HTMLElement): Optional<Node> {
    return undefined;
  }

  render(content: Node): VNode {
    const component = this.components.get(content.name);
    if (!component) {
      throw new Error(`component ${content.name} not found`);
    }

    return component(content);
  }

    mount(root: Element, content: Node): HTMLElement {
    const vnode = this.render(content);
    if (!vnode) {
      throw new Error(`vnode for ${content.name} not found`);
    }

    root.appendChild(vnode.el);
    return vnode.el;
  }

  unregister(id: NodeId): void {
    this.delete(id);
  }

  vnode(id: NodeId | HTMLElement): Optional<VNode> {
    if (id instanceof NodeId) {
      return this.get(id);
    }
  }

  element(id: NodeId): Optional<HTMLElement> {
    return this.vnode(id)?.el;
  }

  register(id: NodeId, vnode: VNode): void {
    // console.log(`registering node ${id.toString()} with vnode`, vnode);
    this.set(id, vnode);
  }

  has(id: NodeId): boolean {
    return super.has(id);
  }
}
