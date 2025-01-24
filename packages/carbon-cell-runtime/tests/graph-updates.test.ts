import { find, noop } from "lodash";
import { test } from "vitest";
import { Graph } from "../src/Graph";
import { Promix } from "../src/Promix";
import { RuntimeError } from "../src/x";

test("test unreachable nodes", async (t) => {
  const G = new Graph<Promix<any>>();
  const a = Promix.default<number>("a");
  const b = Promix.default<number>("b");
  const c = Promix.default<number>("c");
  const d = Promix.default<number>("d");

  G.addNode(a, b, c, d);
  G.addEdge(a, b);
  G.addEdge(b, c);
  G.addEdge(b, d);
  G.addEdge(c, d);

  // initial state
  const pc = precompute([a], G);
  console.log(" ");
  await compute(pc, G);
  console.log(G.variables().map((node) => node.key));
  console.log("--------");

  // b became dirty
  const roots2 = precompute([G.node(b)!], G);
  console.log(" ");
  await compute(roots2, G);
  console.log(G.variables().map((node) => node.key));
  console.log("--------");

  // c became dirty
  const roots3 = precompute([G.node(c)!], G);
  console.log(" ");
  await compute(roots3, G);
  console.log(G.variables().map((node) => node.key));
  console.log("--------");

  // add a new node
  const e = Promix.default<number>("e");
  G.addNode(e);
  G.addEdge(d, e);

  const roots4 = precompute([G.node(e)!], G);
  console.log(" ");
  await compute(roots4, G);
  console.log(G.variables().map((node) => node.key));
  console.log("--------");

  // image c is removed
  const outputs = G.outputs(b);
  G.removeNode(b);
  console.log("removed b");
  const roots5 = precompute(outputs, G);
  const cn = G.node(c);
  cn?.fulfilled(RuntimeError.of("b is missing"));

  await Promix.allSettled(roots5.pending);
  console.log("--------");

  const bc = Promix.default("b");
  G.addNode(bc);

  G.addEdge(bc, c);
  G.addEdge(bc, d);

  const nodes6 = precompute([bc], G);
  await compute(nodes6, G);

  // await compute(roots5, G);
});

function precompute(dirty: Promix<any>[], G: Graph<Promix<any>>) {
  const roots: Promix<any>[] = G.topologicalRoots(dirty);
  const nodes = G.topological(dirty);

  const pending: Promix<any>[] = [];

  const calculate = (next, inputs) => {
    // compute the variable value from inputs
    const value = inputs.join("__") + " " + next.key;

    const error = inputs.find((p) => p instanceof RuntimeError);
    if (error) {
      console.log("runtime error", next.id, "=>", error.toString());
      next.fulfilled(error);
      return;
    }

    console.log("computed:", next.id, "=>", value);

    // update the node with the computed value
    const result = [...inputs, next.key].join(",");
    next.fulfilled(result);
  };

  nodes.forEach((node) => {
    const inputs = G.inputs(node);
    const next = node.next<any>(noop, G.version);
    // console.log("next", next.id, node.version, next.version);
    G.addNode(next);

    if (!inputs.length) {
      const done = next.then((x) => {
        if (x instanceof RuntimeError) {
          console.log("runtime error", next.id, "=>", x.toString());
          return;
        }

        console.log("computed:", next.id, "=>", next.key);
      });
      pending.push(done);
    } else {
      console.log(
        node.id,
        inputs.map((input) => input.id),
      );

      if (find(roots, (input) => input.id === next.id)) {
        // console.log("found root", next.id, next.version);
        const done = next.then(() => Promix.all(inputs).then((ip) => calculate(next, ip)));
        // done
        pending.push(done);
      } else {
        const done = next.all(inputs).then((ip) => calculate(next, ip));
        pending.push(done);
      }
    }

    console.log("connected: " + next.key);
  });

  const newRoots = roots
    .map((root) => {
      return G.node(root);
    })
    .filter((node) => node) as Promix<any>[];

  return {
    roots: newRoots,
    pending: pending,
  };
}

function compute(pc: PrecomputeResult, G: Graph<Promix<any>>) {
  G.version += 1;
  pc.roots.map((root) => {
    return root.fulfilled(root.key);
  });

  return Promix.allSettled(pc.pending);
}

type PrecomputeResult = {
  roots: Promix<any>[];
  pending: Promix<any>[];
};