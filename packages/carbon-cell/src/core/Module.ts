import { Node, NodeIdMap } from "@emrgen/carbon-core";
import { NodeId } from "@emrgen/carbon-core";
import { Carbon } from "@emrgen/carbon-core";
import { EventEmitter } from "events";
import { Runtime } from "@observablehq/runtime";
import { Optional } from "@emrgen/types";

//
export class Module extends EventEmitter {
  readonly app: Carbon;
  cells: NodeIdMap<Node>;
  // cache the views of the cells
  views: NodeIdMap<Optional<HTMLElement>>;
  runtime: Runtime;

  constructor(app: Carbon) {
    super();
    this.app = app;
    this.cells = new NodeIdMap();
    this.views = new NodeIdMap();
    this.runtime = new Runtime();
  }

  view(id: NodeId) {
    const view = this.views.get(id);
    if (view) {
      return view;
    }
    const el = this.app.store.element(id);
    this.views.set(id, el);
  }

  add(node: Node) {
    this.cells.set(node.id, node);
  }

  remove(node: Node) {
    this.cells.delete(node.id);
  }

  get(id: NodeId) {
    return this.cells.get(id);
  }

  has(id: NodeId) {
    return this.cells.has(id);
  }

  compute() {}
}
