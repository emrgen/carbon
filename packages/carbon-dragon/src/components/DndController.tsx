import { Optional, RawPoint } from "@emrgen/types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useDndContext } from "../hooks/useDndContext";
import { DndEvent, RectStyle } from "../types";
import {
  EventsIn,
  Node,
  NodeId,
  Transaction,
  prevent,
  useCarbon,
} from "@emrgen/carbon-core";
import { elementBound } from "../core/utils";
import { DraggableHandle } from "./DraggableHandle";

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
      if (!node.type.isDraggable || dragHandleNode?.eq(node) || dnd.isMouseDown) return;
      const el = app.store.element(node.id);
      if (!portalPosition) return;
      if (!el) return;
      const region = dnd.region;
      if (!region) return;

      const bound = elementBound(el);
      // console.log(el, bound, portalPosition);
      if (node.type.dragHandle) {
        // console.log("onMouseIn", node.id.toString(), bound);
        setDragHandlePosition({
          left: bound.left - portalPosition.x - 50,
          top: bound.top - portalPosition.y + 4,
          width: 50,
          height: 20,
        });
      } else {
        // setDragHandlePosition({
        //   left: bound.left - portalPosition.x - 20,
        //   top: bound.top - portalPosition.y,
        //   width: bound.right - bound.left - 100,
        //   height: bound.bottom - bound.top,
        // });
      }
      setShowDragHandle(true);
      setDragHandleNode(node);

    },
    [dragHandleNode, dnd.isMouseDown, dnd.region, app.store, portalPosition]
  );

  const resetDragHandle = useCallback(() => {
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
      dnd.draggedNodeId = e.node.id;
    },
    [dnd]
  );

  const onDragEnd = useCallback(
    (e: DndEvent) => {
      resetDragHandle();
    },
    [resetDragHandle]
  );

  const onTransaction = useCallback(
    (tr: Transaction) => {
      if (tr.updatesContent) {
        // console.log("updated content");
        dnd.isDirty = true;
        resetDragHandle();
      }
    },
    [dnd, resetDragHandle]
  );

  const onEditorMouseOver = useCallback((e) => {
    // setShowDragHandle(true);
  }, []);

  const onEditorMouseOut = useCallback((e) => {
    // setShowDragHandle(false);
  }, []);

  useEffect(() => {
    // editor.on(EditorEventsIn.mouseOver, onEditorMouseOver);
    // editor.on(EditorEventsIn.mouseOut, onEditorMouseOut);
    app.on("transaction", onTransaction);
    app.on("keyDown", onKeyDown);
    dnd.on("mouse:in", onMouseIn);
    dnd.on("mouse:out", onMouseOut);
    dnd.on("drag:start", onDragStart);
    dnd.on("drag:end", onDragEnd);
    dnd.on("hide:drag:handle", resetDragHandle);
    return () => {
      app.off("mouseIn", onEditorMouseOver);
      app.off("mouseOut", onEditorMouseOut);
      app.off("transaction", onTransaction);
      app.off("keyDown", onKeyDown);
      dnd.off("mouse:in", onMouseIn);
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
    onTransaction,
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
      {dragHandleNode && (
        <DraggableHandle
          node={dragHandleNode}
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
