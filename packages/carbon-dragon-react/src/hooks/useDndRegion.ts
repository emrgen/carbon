import { useCallback, useEffect } from "react";
import { useDndContext } from "./useDndContext";
import { UseFastDraggableProps } from "./useDraggable";

interface UseFastDndRegionProps extends UseFastDraggableProps {}

// create a event listener for the target node
export const useDndRegion = (props: UseFastDndRegionProps) => {
  const { node, ref } = props;

  const dnd = useDndContext();

  const onMouseMove = useCallback(
    (e) => {
      if (e.target === dnd.region) {
        // TODO: this is redundant, we should detect the target node using elementFromPoint
        dnd.onMouseMove(node, e);
      }
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
