import { Node } from "@emrgen/carbon-core";
import { DndEvent, getEventPosition } from "@emrgen/carbon-dragon";
import {
  MutableRefObject,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
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

// create a draggable handle event listener
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
      let initState = {} as any;
      // preventAndStop(event)
      console.log("mouse down", ref.current, event.target);
      if (isDisabled) return;
      if (ref.current !== event.target) return;
      dnd.onMouseDown(node, event);
      console.log(ref.current, event.target);
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
          dragged: isDragging,
          setState(state: any) {},
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
        console.log("xxx");
        const position = getEventPosition(activatorEvent, event);
        if (isDragging) {
          dnd.onDragMove({
            activatorEvent,
            event,
            node,
            id: id ?? node.id,
            state: initState,
            position,
            setState(state: any) {},
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
            setState(state: any) {
              initState = state;
            },
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
  // overlay ref
  ref: MutableRefObject<any>;
  refCheck?: (ref: any, target: any) => boolean;
  node: Node;
  distance: number;
  isDisabled?: boolean;
  onMouseDown(node: Node, event: MouseEvent): void;
  onMouseUp(node: Node, event: DndEvent): void;
  onDragStart(event: DndEvent): void;
  onDragMove(event: DndEvent): void;
  onDragEnd(event: DndEvent): void;
}

let counter = 0;

export function useMakeDraggable<T extends Record<string, any>>(
  props: UseTrackDragProps,
) {
  const {
    refCheck = (ref, target) => ref === target,
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
      let initState: T = {} as T;
      // preventAndStop(event)
      if (isDisabled) return;
      if (!refCheck(ref.current, event.target)) {
        return;
      }
      // event.stopPropagation();
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
          dragged: isDragging,
          setState(state: T) {},
        };
        if (isDragging) {
          onDragEnd(dndEvent);
        }

        onMouseUp(node, dndEvent);
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
            setState(state: T) {},
          });
          return;
        }

        // check if the drag start can be activated
        if (
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
            setState(state: T) {
              initState = state;
            },
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

  return useMemo(
    () => ({
      listeners: {
        onMouseDown: onMouseDownHandler,
      },
      attributes: {
        "data-draggable": true,
      },
    }),
    [onMouseDownHandler],
  );
}