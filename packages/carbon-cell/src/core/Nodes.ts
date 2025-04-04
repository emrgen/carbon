import { Carbon, Node, Predicate, yes } from "@emrgen/carbon-core";
import { identity } from "lodash";

export class Nodes {
  app: Carbon;
  ids: Array<string>;
  constructor(app: Carbon, ids: Array<string>) {
    this.app = app;
    this.ids = ids;
  }

  // get the nodes from the store
  filter(fn: Predicate<Node> = yes): Array<Node> {
    return (
      (
        this.ids.map((id) => this.app.store.get(id)).filter(identity) as Node[]
      ).filter((node) => fn(node)) ?? []
    );
  }

  into<T>(
    fn: (app: Carbon, nodes: Node[]) => T,
    filter: Predicate<Node> = yes,
  ): T {
    const nodes = this.filter(filter);
    return fn(this.app, nodes);
  }
}
