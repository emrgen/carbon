import { MutableRefObject, useCallback, useEffect, useState } from "react";
import { useDndContext } from "./useDndContext";
import { useNodeChange, Node, stop, preventAndStop } from "@emrgen/carbon-core";
import { getEventPosition } from "../core/utils";
import { DndEvent } from "../types";

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
    dnd.onMouseMove(node, e);
  }, [dnd, node]);

  const onMouseOver = useCallback(
    (e) => {
      // console.warn("onMouseOver", e.target, e.currentTarget);
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

export interface UseDraggableHandleProps extends UseFastDraggableProps {
  id?: string;
  disabled?: boolean;
  activationConstraint?: {
    distance?: number;
  };
  onStart?(state: any, position: DndEvent["position"]): void;
}

export const useDraggableHandle = (props: UseDraggableHandleProps) => {
  const { id, node, disabled, ref, activationConstraint = {}, onStart } = props;
  const { distance = 0 } = activationConstraint;
  const [isDisabled, setIsDisabled] = useState(disabled);
  const [state, setState] = useState({});

  useEffect(() => {
    setIsDisabled(disabled);
  }, [disabled, node]);

  const dnd = useDndContext();

  const onMouseDown = useCallback(
    (event) => {
      let initState = {}
      // preventAndStop(event)
      // console.log("mouse down", ref.current, event.target);
      if (isDisabled) return;
      if (ref.current !== event.target) return;
      dnd.onMouseDown(node, event)
      // console.log(ref.current, event.target)
      let isDragging = false;

      const activatorEvent = event;

      const onMouseUp = (event) => {
        const dndEvent = {
          activatorEvent,
          event,
          node,
          id: id ?? node.id,
          state: initState,
          position: getEventPosition(activatorEvent, event),
        };
        if (isDragging) {
          dnd.onDragEnd(dndEvent);
        }

        dnd.onMouseUp(node, dndEvent, isDragging);
        isDragging = false;
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
              id: id ?? node.id,
              state: initState,
              position: getEventPosition(activatorEvent, activatorEvent),
            });
          }

          return;
        } else {
          dnd.onDragMove({
            activatorEvent,
            event,
            node,
            id: id ?? node.id,
            state: initState,
            position,
          });
        }
      };
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);

      if (distance === 0) {
        isDragging = true;
        const position = getEventPosition(activatorEvent, activatorEvent);
        initState = onStart?.(event, position) ?? {};
        dnd.onDragStart({
          activatorEvent,
          event,
          node,
          id: id ?? node.id,
          position,
          state: initState,
        });
      }
    },
    [distance, dnd, id, isDisabled, node, onStart, ref]
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
