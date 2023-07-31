import { Node } from "@emrgen/carbon-core";

export const hasProps = (node: Node) => {
  return !(node.attrs.node.props === undefined || node.attrs.node.props === null)
};

export const nodeProps = (node: Node) => {
  return (node.attrs.node.props ?? [])
};
