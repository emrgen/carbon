import { Node } from "@emrgen/carbon-core";
import { Optional } from "@emrgen/types";
import { MutableRefObject } from "react";
import { useRectSelectable } from "./useRectSelectable";

export interface UseDragDropProps {
  ref: MutableRefObject<Optional<HTMLElement>>;
  node: Node;
}

export const useDragDropRectSelect = (props: UseDragDropProps) => {
  useRectSelectable(props);
};
