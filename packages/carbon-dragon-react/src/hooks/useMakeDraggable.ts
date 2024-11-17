import { Node } from "@emrgen/carbon-core";
import { DndEvent, getEventPosition } from "@emrgen/carbon-dragon";
import { MutableRefObject, useCallback, useMemo } from "react";
import { usePrevious } from '@chakra-ui/react';
import { keys } from "lodash";

interface UseTrackDragProps {
  // drag handle ref
  handleRef: MutableRefObject<any>;
  refCheck?: (ref: any, target: any) => boolean;
  node?: Node;
  distance?: number;
  isDisabled?: boolean;
  onDragStart(event: DndEvent): void;
  onDragMove(event: DndEvent): void;
  onDragEnd(event: DndEvent): void;
  onMouseDown?(event: DndEvent): void;
  onMouseUp?(event: DndEvent): void;
}

// default ref check function
const defaultRefCheck = (refEl, target) => refEl === target;

export function useMakeDraggable(props: UseTrackDragProps) {
  const { refCheck = defaultRefCheck, handleRef, isDisabled, onDragEnd, onDragMove, onDragStart, onMouseDown, onMouseUp, distance = 4, node = Node.IDENTITY } = props;

  const onMouseDownHandler = useCallback(
    (event) => {
      if (isDisabled) return;
      if (!refCheck(handleRef.current, event.target)) {
        return;
      }

      // let the parent handle the event if it wants to (eg. for stopping propagation)
      onMouseDown?.({
        activatorEvent: event,
        event,
        node,
        id: node.id,
        initState: {},
        prevState: {},
        position: getEventPosition(event, event),
        dragged: false,
        setInitState(state: any) { },
        setPrevState(state: any) { },
      });

      let initState: any = {};
      let prevState: any = {};
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
          setInitState(state: any) { },
          setPrevState(state: any) { },
        };

        if (isDragging) {
          onDragEnd(dndEvent);
        }

        onMouseUp?.(dndEvent);
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
    [distance, node, onDragEnd, onDragMove, onDragStart, onMouseDown, onMouseUp, handleRef, isDisabled, refCheck],
  );

  return useMemo(
    () => {
      console.log('recreate drag listeners');
      
      return {
        listeners: {
          onMouseDown: onMouseDownHandler,
        },
        attributes: {
          "data-draggable": true,
        },
      }
    },
    [onMouseDownHandler],
  );
}
