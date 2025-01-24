import { expect, test } from "vitest";
import { Graph } from "../src/Graph";
import { Promix } from "../src/Promix";

test("test unreachable nodes", async (t) => {
  const G = new Graph<Promix<any>>();
  const a = Promix.default<number>("a");
  const b = Promix.default<number>("b");
  const c = Promix.default<number>("c");
  const d = Promix.default<number>("d");
  const e = Promix.default<number>("e");
  const f = Promix.default<number>("f");

  G.addNode(a, b, c, d, e, f);
  // a -> b, a -> c, d -> e, f
  G.addEdge(a, b);
  G.addEdge(a, c);
  G.addEdge(d, e);

  const roots = G.roots();
  expect(roots).toEqual([a, d, f]);

  // when a is updated, b and c should be updated
  const nodes = G.topological([a]);
  expect(nodes).toEqual([a, b, c]);

  // when d is updated, e should be updated
  const nodes2 = G.topological([d]);
  expect(nodes2).toEqual([d, e]);

  // when f is updated, f should be updated
  const nodes3 = G.topological([f]);
  expect(nodes3).toEqual([f]);
});

test("test cycle", async (t) => {
  const G = new Graph<Promix<any>>();
  const a = Promix.default<number>("a");
  const b = Promix.default<number>("b");
  const c = Promix.default<number>("c");

  G.addNode(a, b, c);
  G.addEdge(a, b);
  G.addEdge(b, a);

  const cycle = G.cycle();
  expect(cycle).toBe(true);

  const roots = G.roots();
  expect(roots).toEqual([c]);

  const nodes = G.topological(roots);
  expect(nodes).toEqual([c]);
});

test("test dirty components", async (t) => {
  const G = new Graph<Promix<any>>();
  const a = Promix.default<number>("a");
  const b = Promix.default<number>("b");
  const c = Promix.default<number>("c");
  const d = Promix.default<number>("d");

  G.addNode(a, b, c, d);
  G.addEdge(a, b);
  G.addEdge(c, d);

  const roots = G.roots();
  expect(roots).toEqual([a, c]);

  const nodes = G.topological(roots);
  expect(nodes).toEqual([a, b, c, d]);

  const nodes2 = G.topological([a]);
  expect(nodes2).toEqual([a, b]);

  const nodes3 = G.topological([c]);
  expect(nodes3).toEqual([c, d]);
});

test("test variable dag", async (t) => {
  const G = new Graph<Promix<any>>();
  const a = Promix.default<number>("a");
  const b = Promix.default<number>("b");
  const c = Promix.default<number>("c");
  const d = Promix.default<number>("d");
  const e = Promix.default<number>("e");

  G.addNode(a, b, c, d, e);

  G.addEdge(a, b);

  G.addEdge(a, c);
  G.addEdge(b, c);

  G.addEdge(a, d);

  G.addEdge(b, e);
  G.addEdge(c, e);
  G.addEdge(d, e);

  const roots = G.roots();
  expect(roots).toEqual([a]);

  const cycle = G.cycle();
  expect(cycle).toBe(false);

  const nodes = G.topological([a]);
  expect(new Set(nodes.map((n) => n.id))).toEqual(
    new Set([a.id, b.id, c.id, d.id, e.id]),
  );
});

test("test dirty nodes propagation", async (t) => {
  const G = new Graph<Promix<any>>();
  const a = Promix.default<number>("a");
  const b = Promix.default<number>("b");
  const c = Promix.default<number>("c");
  const d = Promix.default<number>("d");
  const e = Promix.default<number>("e");

  G.addNode(a, b, c, d);
  G.addEdge(a, b);
  G.addEdge(c, d);
  G.addEdge(b, c);

  const roots = G.roots();
  expect(roots).toEqual([a]);

  const nodes = G.topological(roots);
  expect(nodes).toEqual([a, b, c, d]);

  const cycle = G.cycle();
  expect(cycle).toBe(false);

  const nodes2 = G.topological([b]);
  expect(nodes2).toEqual([b, c, d]);

  const nodes3 = G.topological([c]);
  expect(nodes3).toEqual([c, d]);

  G.removeNode(c);
  const cycle2 = G.cycle();
  expect(cycle2).toBe(false);

  const nodes4 = G.topological([a]);
  expect(nodes4).toEqual([a, b]);

  G.addNode(e);
  G.addEdge(b, e);
  G.addEdge(d, e);

  const nodes5 = G.topological([e, b, d]);
  expect(nodes5).toEqual([b, d, e]);
});
