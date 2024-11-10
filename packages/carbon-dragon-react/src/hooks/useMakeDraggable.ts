import { Node } from "@emrgen/carbon-core";
import { DndEvent, getEventPosition } from "@emrgen/carbon-dragon";
import { MutableRefObject, useCallback, useMemo } from "react";

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

export function useMakeDraggable(props: UseTrackDragProps) {
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
      let initState: any = {};
      let prevState: any = {};
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
          initState: initState,
          prevState: prevState,
          position: getEventPosition(activatorEvent, event),
          dragged: isDragging,
          setInitState(state: any) {},
          setPrevState(state: any) {},
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
            initState: initState,
            prevState: prevState,
            position,
            setInitState(state: any) {
              initState = state;
            },
            setPrevState(state: any) {
              prevState = state;
            },
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
            initState: initState,
            position: getEventPosition(activatorEvent, activatorEvent),
            setInitState(state: any) {
              initState = state;
            },
            setPrevState(state: any) {
              prevState = state;
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
      refCheck,
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