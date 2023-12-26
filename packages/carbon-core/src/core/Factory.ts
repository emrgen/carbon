import {Schema, Node, Maps, NodeData} from "@emrgen/carbon-core";
import {Optional} from "@emrgen/types";

export class Factory {
  constructor(
    readonly nodeFactory: NodeFactory,
  ) {}
}

export interface NodeFactory {
  blockId(): string;
  textId(): string;
  create(json: any, schema: Schema): Optional<Node>;
  // clone with new id for all nodes
  clone(node: Node, map: Maps<Omit<NodeData, 'children'>, Omit<NodeData, 'children'>>): Node;
}
