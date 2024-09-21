import { Optional } from "@emrgen/types";
import { NodeId } from "./NodeId";
import { NodeContentData } from "./NodeContent";
import { Schema } from "./Schema";
import { Maps } from "./types";
import { Node } from "./Node";

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
