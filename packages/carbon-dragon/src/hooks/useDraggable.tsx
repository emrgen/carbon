import { MutableRefObject, useCallback, useEffect, useState } from "react";
import { useDndContext } from "./useDndContext";
import { useNodeChange, Node } from "@emrgen/carbon-core";
import { getEventPosition } from "../core/utils";

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
      dnd.onMouseDown(node)
      // console.log(ref.current, event.target)
      let isDragging = false;

      const activatorEvent = event;
      


      const onMouseUp = (event) => {
        if (isDragging) {
          dnd.onDragEnd({
            activatorEvent,
            event,
            node,
            id,
            position: getEventPosition(activatorEvent, event),
          });
        }

        isDragging = false;
        dnd.onMouseUp(node);
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
      };

      const onMouseMove = (event) => {
        const position = getEventPosition(activatorEvent, event);
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
              position: getEventPosition(activatorEvent, activatorEvent),
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
          position: getEventPosition(activatorEvent, activatorEvent),
        });
      }
    },
    [distance, dnd, id, isDisabled, node, ref]
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
