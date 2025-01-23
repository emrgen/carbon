interface NodeId {
  id: string;
}

export class Graph<T extends NodeId> {
  nodes: Map<string, T> = new Map();
  edges: Map<string, Set<string>> = new Map();
  incoming: Map<string, Set<string>> = new Map();

  addNode(...node: T[]) {
    for (const n of node) {
      this.nodes.set(n.id, n);
      this.edges.set(n.id, this.edges.get(n.id) ?? new Set());
      this.incoming.set(n.id, this.incoming.get(n.id) ?? new Set());
    }
  }

  addEdge(from: T, to: T) {
    if (!this.edges.has(from.id)) {
      this.edges.set(from.id, new Set());
    }

    this.edges.get(from.id)!.add(to.id);

    if (!this.incoming.has(to.id)) {
      this.incoming.set(to.id, new Set());
    }
    this.incoming.get(to.id)!.add(from.id);
  }

  removeNode(node: T) {
    this.nodes.delete(node.id);
    this.edges.delete(node.id);
    this.edges.forEach((edges, from) => {
      edges.delete(node.id);
    });

    this.incoming.delete(node.id);
  }

  roots(nodes: T[] = []): T[] {
    if (nodes.length === 0) {
      const components = this.components();
      return components.map((c) => this.roots(Array.from(c.values()))).flat();
    }

    if (this.cycle(nodes)) {
      return [];
    }

    const roots: T[] = [];
    const incoming = new Map<string, number>();
    for (const node of nodes) {
      for (const to of this.edges.get(node.id)!) {
        incoming.set(to, (incoming.get(to) ?? 0) + 1);
      }
    }

    for (const node of nodes) {
      if (!incoming.has(node.id)) {
        roots.push(node);
      }
    }

    return roots;
  }

  cycle(nodes: T[] = []): boolean {
    // check if the graph has a cycle, if nodes is empty, check the whole graph
    if (nodes.length === 0) {
      const components = this.components();
      return components.some((c) => {
        if (this.cycle(Array.from(c.values()))) {
          return true;
        }
      });
    }

    const indegree = new Map<string, number>();
    for (const node of nodes) {
      indegree.set(node.id, this.incoming.get(node.id)?.size ?? 0);
    }

    const queue: T[] = [];
    for (const node of nodes) {
      if (indegree.get(node.id) === 0) {
        queue.push(node);
      }
    }

    let visited = 0;
    while (queue.length > 0) {
      const node = queue.shift()!;
      visited++;

      if (this.edges.has(node.id)) {
        for (const to of this.edges.get(node.id)!) {
          const count = indegree.get(to)! - 1;
          if (count === 0) {
            queue.push(this.nodes.get(to)!);
          } else {
            indegree.set(to, count);
          }
        }
      }
    }

    return visited !== nodes.length;
  }

  // topological sort of the graph starting from the dirty nodes
  topological(dirty: Iterable<T>): T[] {
    const components = this.components();
    const nodeToComponent = new Map<string, number>();
    for (let i = 0; i < components.length; i++) {
      for (const node of components[i].values()) {
        nodeToComponent.set(node.id, i);
      }
    }

    const dirtyGroups = new Map<number, T[]>();
    for (const node of dirty) {
      const component = nodeToComponent.get(node.id);
      if (component === undefined) {
        continue;
      }

      if (!dirtyGroups.has(component)) {
        dirtyGroups.set(component, []);
      }
      dirtyGroups.get(component)!.push(node);
    }

    const sorted: T[] = [];
    for (const nodes of dirtyGroups.values()) {
      sorted.push(...this.topologicalSort(nodes));
    }

    return sorted;
  }

  private topologicalSort(nodes: T[]): T[] {
    // check if the graph has a cycle
    if (this.cycle(nodes)) {
      return [];
    }

    // find the connected nodes to the dirty nodes
    const connected = this.connected(nodes);
    const incoming = new Map<string, number>();
    for (const [id] of connected) {
      incoming.set(id, this.incoming.get(id)?.size ?? 0);
    }

    // find the dirty nodes without incoming edges
    const queue: T[] = [];
    for (const node of nodes) {
      const id = node.id;
      if (!incoming.get(id)) {
        queue.push(node);
      }
    }

    // topological sort
    let i = 0;
    while (i < queue.length) {
      const node = queue[i];
      const id = node.id;
      if (this.edges.has(id)) {
        for (const to of this.edges.get(id)!) {
          const count = incoming.get(to)! - 1;
          if (count === 0) {
            queue.push(connected.get(to)!);
          } else {
            incoming.set(to, count);
          }
        }
      }
      i++;
    }

    return queue;
  }

  connected(from: Iterable<T>): Map<string, T> {
    const connected = new Map<string, T>();
    const queue = Array.from(from);
    while (queue.length > 0) {
      const node = queue.shift()!;
      connected.set(node.id, node);
      if (this.edges.has(node.id)) {
        for (const to of this.edges.get(node.id)!) {
          if (!connected.has(to)) {
            queue.push(this.nodes.get(to)!);
          }
        }
      }
    }

    return connected;
  }

  components(): Map<string, T>[] {
    const components = new Components();
    for (const [id] of this.nodes) {
      components.parents.set(id, id);
      components.ranks.set(id, 0);
    }

    for (const [from, to] of this.edges) {
      for (const t of to) {
        components.union(from, t);
      }
    }

    // console.log(components.components());

    return Array.from(components.components()).map(([_, nodes]) => {
      return new Map(Array.from(nodes.values()).map((id) => [id, this.nodes.get(id)!]));
    });
  }

  // unreachable(): T[] {
  //   const queue = this.roots();
  //   const order: T[] = [];
  //   const incoming = new Map<string, number>();
  //   for (const [_, to] of this.edges) {
  //     for (const t of to) {
  //       incoming.set(t, (incoming.get(t) ?? 0) + 1);
  //     }
  //   }
  //
  //   while (queue.length > 0) {
  //     const node = queue.shift()!;
  //     order.push(node);
  //     if (this.edges.has(node.id)) {
  //       for (const to of this.edges.get(node.id)!) {
  //         const count = incoming.get(to)! - 1;
  //         if (count === 0) {
  //           queue.push(this.nodes.get(to)!);
  //         } else {
  //           incoming.set(to, count);
  //         }
  //       }
  //     }
  //   }
  //
  //   const unreachable: T[] = [];
  //   for (const [id, node] of this.nodes) {
  //     if (!order.includes(node)) {
  //       unreachable.push(node);
  //     }
  //   }
  //
  //   return unreachable;
  // }

  print() {}
}

class Components {
  parents: Map<string, string> = new Map();
  ranks: Map<string, number> = new Map();

  find(x: string): string {
    if (this.parents.get(x) !== x) {
      this.parents.set(x, this.find(this.parents.get(x)!));
    }
    return this.parents.get(x)!;
  }

  union(x: string, y: string) {
    const px = this.find(x);
    const py = this.find(y);
    if (px === py) {
      return;
    }

    if (this.ranks.get(px)! > this.ranks.get(py)!) {
      this.parents.set(py, px);
    } else {
      this.parents.set(px, py);
      if (this.ranks.get(px)! === this.ranks.get(py)!) {
        this.ranks.set(py, this.ranks.get(py)! + 1);
      }
    }
  }

  same(x: string, y: string): boolean {
    return this.find(x) === this.find(y);
  }

  components(): Map<string, Set<string>> {
    const components = new Map<string, Set<string>>();
    for (const [id] of this.parents) {
      const root = this.find(id);
      if (!components.has(root)) {
        components.set(root, new Set());
      }
      components.get(root)!.add(id);
    }

    return components;
  }

}
