import { Node } from "@emrgen/carbon-core";
import { MutableRefObject, useCallback } from "react";
import { useDndContext } from "./useDndContext";

export interface UseNonDraggableProps {
  node: Node;
  ref: MutableRefObject<any>;
}

export const useNonDraggable = (props: UseNonDraggableProps) => {
  const { node } = props;
  const dnd = useDndContext();

  const onMouseMove = useCallback(
    (e) => {
      // TODO: this is redundant, we should detect the target node using elementFromPoint
      dnd.onMouseMove(node, e);
    },
    [dnd, node],
  );

  const onMouseOver = useCallback(
    (e) => {
      dnd.onMouseOver(node, e);
    },
    [dnd, node],
  );

  return {
    listeners: {
      onMouseMove,
      onMouseOver,
    },
    attributes: {},
  };
};
