import {Carbon, NodeId, Node} from "@emrgen/carbon-core";
import {isString} from "lodash";
import {Optional} from "@emrgen/types";

export class Questions {
  app: Carbon;
  nodes: Node[];

  constructor(app: Carbon, nodes: Node[]) {
    this.app = app;
    this.nodes = nodes;
  }

  status(id: string | NodeId | Node) {
    if (isString(id)) {
      id = NodeId.fromString(id);
    }

    let node: Optional<Node> = id as Optional<Node>;
    if (id instanceof NodeId) {
      node = this.nodes.find(n => n.id.eq(id as NodeId));
    }

    return node;
  }
}
