import {RenderStore} from "./RenderContext";
import {ChainComponent} from "@emrgen/carbon-chain";
import {Optional} from "@emrgen/types";
import {Node, NodeId, NodeIdComparator, NodeIdSet} from "@emrgen/carbon-core";
import BTree from 'sorted-btree';
import {v4 as uuidv4} from 'uuid';
import {VNode} from './h';

export class ChainRenderContext extends BTree<NodeId, VNode> implements RenderStore {
  private components: Map<string, ChainComponent> = new Map<string, ChainComponent>();
  nodeScope: Node[] = [];
  scopeIds: BTree<NodeId, number> = new BTree<NodeId, number>(undefined, NodeIdComparator);
  private links: BTree<NodeId, VNode[]> = new BTree<NodeId, VNode[]>(undefined, NodeIdComparator);

  scope(): Node {
    return this.nodeScope[this.nodeScope.length - 1];
  }

  scopeId(): NodeId {
    const scope = this.scope();
    if (!scope) {
      throw new Error('scope not found');
    }

    let id =  this.scopeIds.get(scope.id) ?? 0;
    id++;
    this.scopeIds.set(scope.id, id);

    return NodeId.create(`${scope.id}-${id}`);
  }

  link(id: NodeId, vnode: VNode): void {
    const links = this.links.get(id);
    if (links) {
      links.push(vnode);
    } else {
      this.links.set(id, [vnode]);
    }
  }

  linked(id: NodeId): Optional<VNode[]> {
    return this.links.get(id);
  }

  unlink(id: NodeId, vnode: VNode): void {
    const links = this.links.get(id);
    if (links) {
      const index = links.indexOf(vnode);
      if (index >= 0) {
        links.splice(index, 1);
      }
    }
  }

  component(name: string, component?: ChainComponent): Optional<ChainComponent> {
    if (component) {
      const entry = (node: Node) => {
        this.nodeScope.push(node);
        const vnode = component(node);
        this.nodeScope.pop();
        vnode.scopeId = node.id;
        return vnode;
      }
      entry.id = uuidv4();
      entry.component = name;
      entry.id = uuidv4();
      entry.nodes = NodeIdSet.empty();

      this.components.set(name, entry);
    }

    return this.components.get(name);
  }

  node(id: NodeId | HTMLElement): Optional<Node> {
    return this.vnode(id)?.scope
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
