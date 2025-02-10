import { useCallback, useEffect } from "react";
import { useDndContext } from "./useDndContext";
import { UseFastDraggableProps } from "./useDraggable";

interface UseFastDndRegionProps extends UseFastDraggableProps {}

export const useDndRegion = (props: UseFastDndRegionProps) => {
  const { node, ref } = props;
  const dnd = useDndContext();

  const onMouseMove = useCallback(
    (e) => {
      dnd.onMouseMove(node, e);
    },
    [dnd, node],
  );

  useEffect(() => {
    dnd.region = ref.current;
  }, [dnd, ref]);

  return {
    listeners: {
      onMouseMove,
    },
  };
};
