import { MutableRefObject, useCallback, useEffect, useState } from "react";
import { useDndContext } from "./useDndContext";
import { useNodeChange, Node } from "@emrgen/carbon-core";

export interface UseFastDraggableProps {
  node: Node;
  ref: MutableRefObject<any>;
}

export const useDraggable = (props: UseFastDraggableProps) => {
  const { node, ref } = props;

  const dnd = useDndContext();
  const { version } = useNodeChange(props);

  useEffect(() => {
    if (ref.current && node.type.isDraggable) {
      dnd.onMountDraggable(node, ref.current);
      return () => {
        dnd.onUnmountDraggable(node);
      };
    }
  }, [dnd, node, ref, version]);

  const onMouseMove = useCallback((e) => {
    dnd.onMouseOver(node, e);
  }, [dnd, node]);

  return {
    listeners: {
      onMouseMove,
    },
    attributes: {},
  };
};

export interface UseDraggableHandleProps extends UseFastDraggableProps {
  id?: string;
  disabled?: boolean;
  activationConstraint?: {
    distance?: number;
  };
}

export const useDraggableHandle = (props: UseDraggableHandleProps) => {
  const { id, node, disabled, ref, activationConstraint = {} } = props;
  const { distance = 0 } = activationConstraint;
  const [isDisabled, setIsDisabled] = useState(disabled);
  useEffect(() => {
    setIsDisabled(disabled);
  }, [disabled, node]);

  const dnd = useDndContext();

  const onMouseDown = useCallback(
    (event) => {
      // stop(event)
      // console.log("mouse down", ref.current, event.target);
      if (isDisabled) return;
      if (ref.current !== event.target) return;
      // console.log(ref.current, event.target)
      let isDragging = false;
      const getPosition = (from, to) => {
        const { clientX: startX, clientY: startY } = from;
        const { clientX: endX, clientY: endY } = to;
        return {
          startX,
          startY,
          endX,
          endY,
          deltaX: endX - startX,
          deltaY: endY - startY,
        };
      };

      const activatorEvent = event;

      const onMouseUp = (event) => {
        if (isDragging) {
          dnd.onDragEnd({
            activatorEvent,
            event,
            node,
            id,
            position: getPosition(activatorEvent, event),
          });
        }

        isDragging = false;
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
      };

      const onMouseMove = (event) => {
        const position = getPosition(activatorEvent, event);
        if (!isDragging) {
          if (
            Math.pow(position.deltaX, 2) + Math.pow(position.deltaY, 2) >
            Math.pow(distance, 2)
          ) {
            isDragging = true;
            dnd.onDragStart({
              activatorEvent,
              event,
              node,
              id,
              position: getPosition(activatorEvent, activatorEvent),
            });
          }

          return;
        } else {
          dnd.onDragMove({
            activatorEvent,
            event,
            node,
            id,
            position,
          });
        }
      };
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);

      if (distance == 0) {
        isDragging = true;
        dnd.onDragStart({
          activatorEvent,
          event,
          node,
          id,
          position: getPosition(activatorEvent, activatorEvent),
        });
      }
    },
    [isDisabled]
  );

  return {
    listeners: {
      onMouseDown,
    },
    attributes: {
      "data-draggable": true,
    },
  };
};
