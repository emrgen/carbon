import { Node, prevent, preventAndStop } from "@emrgen/carbon-core";
import { DndEvent, getEventPosition } from "@emrgen/carbon-dragon";
import {
  MutableRefObject,
  useCallback,
  useEffect,
  useRef,
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
// this function is very similar to useMakeDraggable,
// but it's more focused on the handle and the events are dispatched to the dnd context directly
export const useDraggableHandle = (props: UseDraggableHandleProps) => {
  const { id, node, disabled, ref, activationConstraint = {} } = props;
  const { distance = 2 } = activationConstraint;
  const [isDisabled, setIsDisabled] = useState(disabled);
  const refId = useRef<string>(Math.random().toString(16).slice(6));

  useEffect(() => {
    setIsDisabled(disabled);
  }, [disabled, node]);

  const dnd = useDndContext();

  const onMouseDown = useCallback(
    (event) => {
      // mousedown on a draggable handle should not trigger have any other effect than dragging
      let initState = {} as any;
      let prevState = {} as any;
      // using object ref to check if the mouse is up
      let mouseUpped = { current: false };
      // console.log("mouse down", ref.current, event.target, refId.current);
      if (isDisabled) return;
      if (ref.current !== event.target) return;
      dnd.onMouseDown(node, event);
      // prevent default behavior like text selection, image dragging, etc
      prevent(event);
      let isDragging = false;

      const activatorEvent = event;

      const getInitState = (k) => initState[k];
      const getPrevState = (k) => prevState[k];
      const setInitState = (k, state) => {
        initState[k] = state;
        prevState[k] = state;
      };
      const setPrevState = (k, state) => {
        prevState[k] = state;
      };

      const onMouseUp = (event: MouseEvent) => {
        const dndEvent = {
          activatorEvent,
          event,
          node,
          id: id ?? node.id,
          initState: initState,
          prevState: prevState,
          position: getEventPosition(activatorEvent, event),
          dragged: isDragging,
          getInitState,
          getPrevState,
          setInitState,
          setPrevState,
        };

        if (isDragging) {
          preventAndStop(event);
          dnd.onDragEnd(dndEvent);
        }

        dnd.onMouseUp(node, dndEvent, isDragging);
        mouseUpped.current = true;
        isDragging = false;
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
      };

      const onMouseMove = (event: MouseEvent) => {
        if (mouseUpped.current) return;

        const position = getEventPosition(activatorEvent, event);
        if (isDragging) {
          prevent(event);
          dnd.onDragMove({
            activatorEvent,
            event,
            node,
            id: id ?? node.id,
            position,
            getInitState,
            getPrevState,
            setInitState,
            setPrevState,
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
          prevent(event);
          dnd.onDragStart({
            activatorEvent,
            event,
            node,
            id: id ?? node.id,
            position: getEventPosition(activatorEvent, activatorEvent),
            getInitState,
            getPrevState,
            setInitState,
            setPrevState,
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
