import { Node } from "@emrgen/carbon-core";
import { MutableRefObject } from "react";
import { useDndContext } from "./useDndContext";

export interface UseNonDraggableProps {
  node: Node;
  ref: MutableRefObject<any>;
}

export const useNonDraggable = (props: UseNonDraggableProps) => {
  const { node } = props;
  const dnd = useDndContext();

  return {
    attributes: {},
  };
};
