import { expect, test } from "vitest";
import { Graph } from "../src/Graph";
import { Promix } from "../src/Promix";

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