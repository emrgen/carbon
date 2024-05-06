import {
  Maps,
  Node,
  NodeContentData,
  NodeId,
  Schema,
} from "@emrgen/carbon-core";
import { Optional } from "@emrgen/types";

export class Factory {
  constructor(readonly nodeFactory: NodeFactory) {}
}

export interface NodeFactory {
  blockId(): NodeId;

  textId(): NodeId;

  create(json: any, schema: Schema): Optional<Node>;

  // clone with new id for all nodes
  clone(
    node: Node,
    map: Maps<
      Omit<NodeContentData, "children">,
      Omit<NodeContentData, "children">
    >,
  ): Node;
}
