import { Node } from "@emrgen/carbon-core";

export const hasAttrs = (node: Node) => {
  return (node.data.node.attrs ?? []).length > 0;
};

export const nodeAttrs = (node: Node) => {
  return (node.data.node.attrs ?? [])
};
