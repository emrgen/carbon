interface NodeId {
  id: string;
  version: number;
}

export class Graph<T extends NodeId> {
  nodes: Map<string, T> = new Map();
  outgoing: Map<string, Set<string>> = new Map();
  incoming: Map<string, Set<string>> = new Map();

  version: number = 0

  variables(): T[] {
    return Array.from(this.nodes.values());
  }

  inputs(node: T): T[] {
    const inputs: T[] = [];
    for (const from of this.incoming.get(node.id) ?? []) {
      inputs.push(this.nodes.get(from)!);
    }
    return inputs;
  }

  outputs(node: T): T[] {
    const outputs: T[] = [];
    for (const to of this.outgoing.get(node.id) ?? []) {
      outputs.push(this.nodes.get(to)!);
    }
    return outputs;
  }

  node(node: T): T | undefined {
    return this.nodes.get(node.id);
  }

  addNode(...nodes: T[]) {
    for (const n of nodes) {
      this.nodes.set(n.id, n);
      this.outgoing.set(n.id, this.outgoing.get(n.id) ?? new Set());
      this.incoming.set(n.id, this.incoming.get(n.id) ?? new Set());
      this.version = Math.max(this.version, n.version)
    }
  }

  addEdge(from: T, to: T) {
    if (from.id === to.id) {
      return;
    }

    if (!this.outgoing.has(from.id)) {
      this.outgoing.set(from.id, new Set());
    }

    this.outgoing.get(from.id)!.add(to.id);

    if (!this.incoming.has(to.id)) {
      this.incoming.set(to.id, new Set());
    }
    this.incoming.get(to.id)!.add(from.id);
  }

  removeNode(node: T) {
    this.nodes.delete(node.id);

    const outgoing = Array.from(this.outgoing.get(node.id)??[]);
    const incoming = Array.from(this.incoming.get(node.id)??[]);

    // remove the node from the incoming edges for dependent nodes
    incoming.forEach((from) => {
      this.outgoing.get(from)?.delete(node.id);
    });

    // remove the node from the outgoing edges for dependencies
    outgoing.forEach((to) => {
      this.incoming.get(to)?.delete(node.id);
    });

    this.outgoing.delete(node.id);
    this.incoming.delete(node.id);
  }

  roots(nodes: T[] = Array.from(this.nodes.values())): T[] {
    const connected = this.connected(nodes);
    const incoming = new Map<string, number>();
    for (const node of connected.values()) {
      for (const to of this.outgoing.get(node.id)!) {
        incoming.set(to, (incoming.get(to) ?? 0) + 1);
      }
    }

    // find the dirty nodes without incoming outgoing
    const roots: T[] = [];
    for (const node of nodes) {
      const id = node.id;
      if (!incoming.get(id)) {
        roots.push(node);
      }
    }

    return roots;
  }

  // return the nodes in the order they need to be recomputed
  // all nodes connected to the dirty nodes are included in the result
  // no upstream nodes are excluded from the result
  topological(dirty: Iterable<T> = Array.from(this.nodes.values())): {
    roots: T[],
    sorted: T[],
    circular: T[]
  } {
    const nodes = Array.from(dirty);
    const connected = this.connected(nodes);
    const incoming = new Map<string, number>();
    for (const node of connected.values()) {
      for (const to of this.outgoing.get(node.id)!) {
        incoming.set(to, (incoming.get(to) ?? 0) + 1);
      }
    }

    // find the dirty nodes without incoming outgoing
    const queue: T[] = [];
    for (const node of nodes) {
      const id = node.id;
      if (!incoming.get(id)) {
        queue.push(node);
      }
    }


    // console.log('queue',queue.map((n) => n.id));
    // topological sort
    const roots = Array.from(queue);

    // will include the roots as well
    const pending: T[] = [];

    while (queue.length) {
      const node = queue.shift()!;
      pending.push(node)

      const id = node.id;
      if (this.outgoing.has(id)) {
        for (const to of this.outgoing.get(id)!) {
          const count = incoming.get(to)! - 1;
          if (count === 0) {
            queue.push(this.nodes.get(to)!);
          } else {
            incoming.set(to, count);
          }
        }
      }
    }

    const pendingSet = new Set(pending.map((n) => n.id));
    const circular = nodes.filter((node) => !pendingSet.has(node.id));

    return {
      roots: roots,
      sorted: Array.from(pending),
      circular: circular,
    };
  }

  connected(from: Iterable<T>): Map<string, T> {
    const connected = new Map<string, T>();
    const queue = Array.from(from);
    while (queue.length > 0) {
      const node = queue.shift()!;
      connected.set(node.id, node);
      if (this.outgoing.has(node.id)) {
        for (const to of this.outgoing.get(node.id)!) {
          if (!connected.has(to)) {
            queue.push(this.nodes.get(to)!);
          }
        }
      }
    }

    return connected;
  }

  components(nodes: T[] = Array.from(this.nodes.values())): Map<string, T>[] {
    const components = new Components();
    for (const {id} of nodes) {
      components.parents.set(id, id);
      components.ranks.set(id, 0);
    }

    for (const [from, to] of this.outgoing) {
      for (const t of to) {
        components.union(from, t);
      }
    }

    // console.log(components.components());

    return Array.from(components.components()).map(([_, nodes]) => {
      return new Map(
        Array.from(nodes.values()).map((id) => [id, this.nodes.get(id)!]),
      );
    });
  }

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
