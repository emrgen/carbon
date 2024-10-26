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

  return {
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

interface UseTrackDragProps {
  node: Node;
  distance: number;
  isDisabled?: boolean;
  ref: MutableRefObject<any>;
  onMouseDown(node: Node, event: MouseEvent): void;
  onMouseUp(node: Node, event: DndEvent, isDragging: boolean): void;
  onDragStart(event: DndEvent): void;
  onDragMove(event: DndEvent): void;
  onDragEnd(event: DndEvent): void;
}

export const useTrackDrag = (props: UseTrackDragProps) => {
  const {
    node,
    distance,
    isDisabled,
    onMouseDown,
    onMouseUp,
    onDragMove,
    onDragStart,
    onDragEnd,
    ref,
  } = props;
  const onMouseDownHandler = useCallback(
    (event) => {
      let initState = {};
      // preventAndStop(event)
      // console.log("mouse down", ref.current, event.target);
      if (isDisabled) return;
      if (ref.current !== event.target) return;
      onMouseDown(node, event);
      // console.log(ref.current, event.target)
      let isDragging = false;

      const activatorEvent = event;

      const _onMouseUp = (event: MouseEvent) => {
        const dndEvent = {
          activatorEvent,
          event,
          node,
          id: node.id,
          state: initState,
          position: getEventPosition(activatorEvent, event),
        };
        if (isDragging) {
          onDragEnd(dndEvent);
        }

        onMouseUp(node, dndEvent, isDragging);
        isDragging = false;
        window.removeEventListener("mousemove", _onMouseMove);
        window.removeEventListener("mouseup", _onMouseUp);
      };

      const _onMouseMove = (event: MouseEvent) => {
        const position = getEventPosition(activatorEvent, event);
        if (isDragging) {
          onDragMove({
            activatorEvent,
            event,
            node,
            id: node.id,
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
          onDragStart({
            activatorEvent,
            event,
            node,
            id: node.id,
            state: initState,
            position: getEventPosition(activatorEvent, activatorEvent),
          });
        }
      };

      window.addEventListener("mousemove", _onMouseMove);
      window.addEventListener("mouseup", _onMouseUp);

      return () => {
        window.removeEventListener("mousemove", _onMouseMove);
        window.removeEventListener("mouseup", _onMouseUp);
      };
    },
    [
      distance,
      isDisabled,
      node,
      onDragEnd,
      onDragMove,
      onDragStart,
      onMouseDown,
      onMouseUp,
      ref,
    ],
  );

  return {
    listeners: {
      onMouseDown: onMouseDownHandler,
    },
    attributes: {
      "data-draggable": true,
    },
  };
};