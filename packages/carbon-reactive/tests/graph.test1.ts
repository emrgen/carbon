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

  // const roots = G.roots();
  // expect(roots).toEqual([a, d, f]);

  // when a is updated, b and c should be updated
  const nodes = G.topological([a]);
  expect(nodes.sorted).toEqual([a, b, c]);

  // when d is updated, e should be updated
  const nodes2 = G.topological([d]);
  expect(nodes2.sorted).toEqual([d, e]);

  // when f is updated, f should be updated
  const nodes3 = G.topological([f]);
  expect(nodes3.sorted).toEqual([f]);
});

test("test cycle", async (t) => {
  const G = new Graph<Promix<any>>();
  const a = Promix.default<number>("a");
  const b = Promix.default<number>("b");
  const c = Promix.default<number>("c");

  G.addNode(a, b, c);
  G.addEdge(a, b);
  G.addEdge(b, a);

  const nodes = G.topological();
  expect(nodes.roots).toEqual([c]);
  expect(nodes.sorted).toEqual([c]);
  expect(nodes.circular).toEqual([a, b]);
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
  expect(nodes.sorted).toEqual([a, c, b, d]);

  const nodes2 = G.topological([a]);
  expect(nodes2.sorted).toEqual([a, b]);

  const nodes3 = G.topological([c]);
  expect(nodes3.sorted).toEqual([c, d]);
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

  const res = G.topological(roots);
  expect(res.circular.length).toBe(0);

  const nodes = G.topological([a]);
  expect(nodes.sorted).toEqual([a, b, d, c, e]);
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
  expect(nodes.sorted).toEqual([a, b, c, d]);
  expect(nodes.circular.length).toBe(0);

  const nodes2 = G.topological([b]);
  expect(nodes2.sorted).toEqual([b, c, d]);

  const nodes3 = G.topological([c]);
  expect(nodes3.sorted).toEqual([c, d]);

  G.removeNode(c);

  const nodes4 = G.topological([a]);
  expect(nodes4.sorted).toEqual([a, b]);

  G.addNode(e);
  G.addEdge(b, e);
  G.addEdge(d, e);

  const nodes5 = G.topological([e, b, d]);
  expect(nodes5.sorted).toEqual([b, d, e]);
});
