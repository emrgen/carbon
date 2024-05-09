import { Node } from "@emrgen/carbon-core";

export const isNestableNode = (node: Node) => {
  return node.groups.includes("nestable");
};

// TODO: check if the current schema of the node allows conversion to the target type
export const isConvertible = (node: Node) => {
  return !node.isDocument && isNestableNode(node);
};
