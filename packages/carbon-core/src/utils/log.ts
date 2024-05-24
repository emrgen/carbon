import { Node } from "../core/Node";
import { NodeId } from "@emrgen/carbon-core";

export const printId = (id: NodeId) => {
  console.log(id.toString());
};

export const printNodeId = (node: Node) => {
  console.log(node.id.toString());
};

export const printIds = (ids: NodeId[]) => {
  console.log(ids.map((id) => id.toString()));
};

export const printNodeIds = (nodes: Node[]) => {
  console.log(nodes.map((n) => n.id.toString()));
};

export const printNodeNames = (nodes: Node[]) => {
  console.log(nodes.map((n) => n.name));
};
