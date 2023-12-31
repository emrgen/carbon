import {RenderStore, ScopeId} from "./RenderContext";
import {ChainComponent, VNodeChildren, VNodeProps} from "./h";
import {Optional} from "@emrgen/types";
import {Node, NodeId, NodeIdComparator, NodeIdSet} from "@emrgen/carbon-core";
import BTree from 'sorted-btree';
import {v4 as uuidv4} from 'uuid';
import {ChainVNode} from './h';
import {isFunction} from "lodash";

export interface ChainComponentEntry {
  component: (props: VNodeProps, children?: VNodeChildren) => Optional<ChainVNode>;
  id: string;
  name: string;
  nodes: NodeIdSet;
}

export class ChainRenderContext extends BTree<NodeId, ChainVNode> implements RenderStore {
  private components: Map<string, ChainComponentEntry> = new Map<string, ChainComponentEntry>();
  nodeScope: Node[] = [];
  scopeIds: BTree<NodeId, number> = new BTree<NodeId, number>(undefined, NodeIdComparator);
  private links: BTree<NodeId, ChainVNode[]> = new BTree<NodeId, ChainVNode[]>(undefined, NodeIdComparator);

  scope(): Node {
    return this.nodeScope[this.nodeScope.length - 1];
  }

  // scopeId(): ScopeId {
  //   const scope = this.scope();
  //   if (!scope) {
  //     throw new Error('scope not found');
  //   }
  //
  //   let id =  this.scopeIds.get(scope.id) ?? 0;
  //   id++;
  //   this.scopeIds.set(scope.id, id);
  //
  //   return NodeId.create(`${scope.id}-${id}`);
  // }

  link(scopeId: ScopeId, vnode: ChainVNode): void {
    const links = this.links.get(scopeId.nodeId);
    if (links) {
      links.push(vnode);
    } else {
      this.links.set(scopeId.nodeId, [vnode]);
    }
  }

  linked(id: NodeId): Optional<ChainVNode[]> {
    return this.links.get(id);
  }

  unlink(id: NodeId, vnode: ChainVNode): void {
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
      const entry: ChainComponentEntry = {
        component: (props: VNodeProps, children?: VNodeChildren) => {
          const {node} = props;
          let scope: Node | undefined;
          if (isFunction(node)) {
            const scopeNode = node();
          } else {
            scope = node;
          }

          if (!scope) {
            return null
          }

          this.nodeScope.push(scope);
          const vnode = component({node: scope}, []);
          this.nodeScope.pop();
          if (!vnode) {
            return null
          }

          this.register(scope.id, vnode);
          vnode.scope = scope;
          vnode.scopeId = ScopeId.from(scope.id)
          entry.nodes.add(scope.id);

          return vnode;
        },
        id: uuidv4(),
        name,
        nodes: NodeIdSet.empty(),
      }

      this.components.set(name, entry);
    }

    const entry = this.components.get(name);
    if (!entry) {
      return null
    }

    return entry.component;
  }

  node(id: NodeId | HTMLElement): Optional<Node> {
    return this.vnode(id)?.scope
  }

  render(content: Node): Optional<ChainVNode> {
    const entry = this.components.get(content.name);
    if (!entry) {
      return null
    }

    return entry.component({node: content});
  }

    mount(root: Element, content: Node): HTMLElement {
      console.log('xxxxxxxx')
    const vnode = this.render(content);
    if (!vnode) {
      throw new Error(`vnode for ${content.name} not found`);
    }

      console.log(vnode)

    root.appendChild(vnode.el);
    return vnode.el;
  }

  unregister(id: NodeId): void {
    this.delete(id);
  }

  vnode(id: NodeId | HTMLElement): Optional<ChainVNode> {
    if (id instanceof NodeId) {
      return this.get(id);
    }
  }

  element(id: NodeId): Optional<HTMLElement> {
    return this.vnode(id)?.el;
  }

  register(id: NodeId, vnode: ChainVNode): void {
    // console.log(`registering node ${id.toString()} with vnode`, vnode);
    this.set(id, vnode);
  }

  has(id: NodeId): boolean {
    return super.has(id);
  }
}
