import { MutableRefObject, useCallback, useEffect } from "react";
import { useDndContext } from "./useDndContext";
import { Node, useNodeChange } from "@emrgen/carbon-core";

export interface UseNonDraggableProps {
  node: Node;
  ref: MutableRefObject<any>;
}

export const useNonDraggable = (props: UseNonDraggableProps) => {
  const { node } = props;
  const dnd = useDndContext();

  const onMouseMove = useCallback(
    (e) => {
      dnd.onMouseMove(node, e);
    },
    [dnd, node]
  );

  const onMouseOver = useCallback(
    (e) => {
      dnd.onMouseOver(node, e);
    },
    [dnd, node]
  );

  return {
    listeners: {
      onMouseMove,
      onMouseOver,
    },
    attributes: {},
  };
};
