import { Optional, RawPoint } from "@emrgen/types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDndContext } from "../hooks/useDndContext";
import {
  EventsIn,
  Node,
  NodeId,
  Transaction,
  prevent,
  State
} from "@emrgen/carbon-core";
import { DraggableHandle } from "./DraggableHandle";
import { throttle } from "lodash";
import {useCarbon, useCarbonOverlay} from "@emrgen/carbon-react";
import {DndEvent, elementBound, RectStyle} from "@emrgen/carbon-dragon";

export function DndController() {
  const app = useCarbon();
  const dnd = useDndContext();
  const portalRef = useRef(null);
  const [portalPosition, setPortalPosition] = useState<Optional<RawPoint>>();
  const [dragHandleNode, setDragHandleNode] = useState<Optional<Node>>();
  const [showDragHandle, setShowDragHandle] = useState(false);
  const [dragHandlePosition, setDragHandlePosition] =
    useState<Optional<RectStyle>>(null);
  const [isDragging, setIsDragging] = useState(dnd.isDragging);
  const [draggedNode, setDraggedNode] = useState<Optional<Node>>(
    dnd.draggedNode
  );
  const { showOverlay, hideOverlay } = useCarbonOverlay();

  // listen to scroll event to reset drag handle
  useEffect(() => {
    const handleScroll = () => {
      setDragHandleNode(null);
      dnd.isDirty = true;
      dnd.draggedNodeId = null;
    }

    app.on(EventsIn.scroll, handleScroll)
    return () => {
      app.off(EventsIn.scroll, handleScroll)
    }
  }, [app, dnd]);

  useEffect(() => {
    if (portalRef.current) {
      dnd.portal = portalRef.current;
      const { left, top } = elementBound(portalRef.current);
      setPortalPosition({ x: left, y: top });
    } else {
      dnd.portal = null;
      setPortalPosition(null);
    }
  }, [dnd, portalRef]);

  const onMouseIn = useCallback(
    (node: Node) => {
      if (!portalPosition) return;
      if (!node.type.isDraggable || dragHandleNode?.eq(node) || dnd.isMouseDown) return;
      const el = app.store.element(node.id);
      if (!el) return;

      const region = dnd.region;
      if (!region) return;
      const bound = elementBound(el);

      // console.log(node.name, node.type.dragHandle);
      if (node.type.dragHandle) {
        // console.log("onMouseIn", node.id.toString(), bound);
        setDragHandlePosition({
          left: bound.left - portalPosition.x - 50,
          top: bound.top - portalPosition.y + 4,
          width: 0,
          height: 20,
        });
      } else {
        setDragHandlePosition({
          left: bound.left - portalPosition.x,
          top: bound.top - portalPosition.y,
          width: bound.right - bound.left,
          height: bound.bottom - bound.top,
        });
      }
      setShowDragHandle(true);
      setDragHandleNode(node);
    },
    [dragHandleNode, dnd.isMouseDown, dnd.region, app.store, portalPosition]
  );

  // reset drag handle
  const resetDragHandle = useCallback(() => {
    if (!dnd.draggedNodeId) return;
    setIsDragging(false);
    setDraggedNode(null);
    setShowDragHandle(false);
    setDragHandleNode(null);
    dnd.draggedNodeId = null;
  }, [dnd]);

  const onMouseOut = useCallback(
    (nodeId: NodeId) => {
      resetDragHandle();
    },
    [resetDragHandle]
  );

  const onKeyDown = useCallback(
    (e) => {
      resetDragHandle();
    },
    [resetDragHandle]
  );

  const onDragStart = useCallback(
    (e: DndEvent) => {
      setIsDragging(true);
      setDraggedNode(e.node);
      setShowDragHandle(true);
      app.disable();
      console.log('----------');
      dnd.draggedNodeId = e.node.id;
      showOverlay(e.id.toString());
    },
    [app, dnd, showOverlay]
  );

  const onDragEnd = useCallback(
    (e: DndEvent) => {
      resetDragHandle();
      app.enable();
      hideOverlay();
    },
    [resetDragHandle, app, hideOverlay]
  );

  const onChange = useCallback(
    (state: State) => {
      if (state.isContentChanged) {
        // resetDragHandle();
      }
    },
    [resetDragHandle]
  );


  const onEditorMouseOver = useCallback((e) => {
    // setShowDragHandle(true);
  }, []);

  const onEditorMouseOut = useCallback((e) => {
    // setShowDragHandle(false);
  }, []);

  useEffect(() => {
    const thMouseIn = throttle(onMouseIn, 100);
    // editor.on(EditorEventsIn.mouseOver, onEditorMouseOver);
    // editor.on(EditorEventsIn.mouseOut, onEditorMouseOut);
    app.on("changed", onChange);
    app.on("keyDown", onKeyDown);
    dnd.on("mouse:in", thMouseIn);
    dnd.on("mouse:out", onMouseOut);
    dnd.on("drag:start", onDragStart);
    dnd.on("drag:end", onDragEnd);
    dnd.on("hide:drag:handle", resetDragHandle);
    return () => {
      // react.off("mouseIn", onEditorMouseOver);
      // react.off("mouseOut", onEditorMouseOut);
      app.off("changed", onChange);
      app.off("keyDown", onKeyDown);
      dnd.off("mouse:in", thMouseIn);
      dnd.off("mouse:out", onMouseOut);
      dnd.off("drag:start", onDragStart);
      dnd.off("drag:end", onDragEnd);
      dnd.off("hide:drag:handle", resetDragHandle);
    };
  }, [
    app,
    dnd,
    onDragEnd,
    onDragStart,
    onEditorMouseOut,
    onEditorMouseOver,
    onKeyDown,
    onMouseIn,
    onMouseOut,
    onChange,
    resetDragHandle,
  ]);

  const dragHandleOpacity = useMemo(() => {
    return !isDragging && dragHandlePosition && showDragHandle ? 1 : 0;
  }, [isDragging, showDragHandle, dragHandlePosition]);

  // useEffect(() => {
  //   console.log(isDragging);
  // }, [isDragging]);

  // console.log(dragHandleOpacity, !isDragging, dragHandleNode, showDragHandle);
  // console.log(isDragging)
  return (
    <>
    <div className="carbon-dnd-portal" ref={portalRef}>
      {(
        <DraggableHandle
          node={dragHandleNode ?? Node.IDENTITY}
          style={{
            ...dragHandlePosition,
            opacity: dragHandleOpacity,
            pointerEvens: dragHandleOpacity ? "auto" : "none",
          }}
        />
      )}
    </div>

      {/* {isDragging && (
        <div
          className={"carbon-drag-overlay " + draggedNode?.name ?? ""}
          onMouseMove={prevent}
        ></div>
      )} */}
    </>
  );
}
