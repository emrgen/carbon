import { Node } from "@emrgen/carbon-core";
import { DndEvent, getEventPosition } from "@emrgen/carbon-dragon";
import { MutableRefObject, useCallback, useEffect, useState } from "react";
import { useDndContext } from "./useDndContext";

export interface UseFastDraggableProps {
  node: Node;
  ref: MutableRefObject<any>;
}

export const useDraggable = (props: UseFastDraggableProps) => {
  const { node, ref } = props;
  const dnd = useDndContext();

  useEffect(() => {
    if (ref.current && node.type.isDraggable) {
      dnd.onMountDraggable(node, ref.current);
      return () => {
        dnd.onUnmountDraggable(node);
      };
    }
  }, [dnd, node, ref]);

  const onMouseMove = useCallback(
    (e) => {
      // TODO: this is redundant, we should detect the target node using elementFromPoint
      dnd.onMouseMove(node, e);
    },
    [dnd, node],
  );

  const onMouseOver = useCallback(
    (e) => {
      // console.warn("onMouseOver", e.target, e.currentTarget);
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
      let initState = {};
      // preventAndStop(event)
      // console.log("mouse down", ref.current, event.target);
      if (isDisabled) return;
      if (ref.current !== event.target) return;
      dnd.onMouseDown(node, event);
      // console.log(ref.current, event.target)
      let isDragging = false;

      const activatorEvent = event;

      const onMouseUp = (event: MouseEvent) => {
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

      const onMouseMove = (event: MouseEvent) => {
        const position = getEventPosition(activatorEvent, event);
        if (isDragging) {
          dnd.onDragMove({
            activatorEvent,
            event,
            node,
            id: id ?? node.id,
            state: initState,
            position,
          });
          return;
        }

        // check if the drag start can be activated
        if (distance === 0) {
          isDragging = true;
        } else if (
          Math.pow(position.deltaX, 2) + Math.pow(position.deltaY, 2) >
          Math.pow(distance, 2)
        ) {
          isDragging = true;
        }

        if (isDragging) {
          dnd.onDragStart({
            activatorEvent,
            event,
            node,
            id: id ?? node.id,
            state: initState,
            position: getEventPosition(activatorEvent, activatorEvent),
          });
        }
      };

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);

      return () => {
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
      };
    },
    [distance, dnd, id, isDisabled, node, ref],
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
