import { Node } from "@emrgen/carbon-core";
import { Optional } from "@emrgen/types";

export const nodePlaceholder = (node: Optional<Node>) => {
  return node?.type.spec.attrs?.node?.placeholder??''
}
