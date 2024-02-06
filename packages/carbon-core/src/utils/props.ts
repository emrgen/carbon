import {ContenteditablePath, Node} from "@emrgen/carbon-core";

export const isContentEditable = (node: Node) => {
  return node.props.get<boolean>(ContenteditablePath);
}
