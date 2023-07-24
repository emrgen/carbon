import { Optional } from "@emrgen/types";
import { useCombineListeners } from "../hooks/useCombineListeners";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useDndMonitor } from "../hooks/useDndMonitor";
import { useDraggableHandle } from "../hooks/useDraggable";
import { useDragRect } from "../hooks/useDragRect";
import {
  ActionOrigin,
  Node,
  Pin,
  PinnedSelection,
  preventAndStop,
  useCarbon,
} from "@emrgen/carbon-core";
import { DndEvent } from "../types";
import { HiOutlinePlus } from "react-icons/hi";
import { PiDotsSixVerticalBold } from "react-icons/pi";

export interface FastDragHandleProps {
  node: Optional<Node>;
  style: any;
}

export const CarbonDragHandleId = "carbon-drag-handle";

export function DraggableHandle(props: FastDragHandleProps) {
  const { node, style } = props;

  const app = useCarbon();

  const ref = useRef(null);
  const { listeners } = useDraggableHandle({
    id: CarbonDragHandleId,
    node: node as Node,
    disabled: !node,
    ref,
    activationConstraint: {
      distance: 4,
    },
  });

  const { DragRectComp, onDragRectProgress, onDragRectStop } = useDragRect({
    overlay: true,
  });


  const onDragStart = useCallback((e: DndEvent) => {
    if (e.id === CarbonDragHandleId) {
      e.event.stopPropagation();
      // app.tr.selectNodes([])?.dispatch();
    }
  }, []);

  const onDragMove = useCallback(
    (e: DndEvent) => {
      if (e.id === CarbonDragHandleId) {
        onDragRectProgress(e);
      }
    },
    [onDragRectProgress]
  );

  const onDragEnd = useCallback(
    (e: DndEvent) => {
      if (e.id === CarbonDragHandleId) {
        onDragRectStop(e);
      }
    },
    [onDragRectStop]
  );

  const onMouseUp = useCallback((node, event, isDragging) => {
    console.log("onMouseUp", node, event, isDragging);
    if (isDragging) {
      event.stopPropagation();
      event.preventDefault();
    } else {
      if (node) {
        app.tr.selectNodes(node.id)?.dispatch();
      }
    }
  }
  , [app]);

  useDndMonitor({
    onDragStart,
    onDragMove,
    onDragEnd,
    onMouseUp,
  });

  const handleAddNode = (e) => {
    preventAndStop(e);
    if (!node) return;
    if (node.isEmpty) {
      if (node.isAtom && node.nextSibling?.isEmpty) {
        return;
      }

      const title = node.find((n) => n.isTextBlock);
      if (node.isContainerBlock && title) {
        const after = PinnedSelection.fromPin(Pin.toStartOf(title)!);
        if (app.selection.eq(after)) return;
        app.tr.select(after, ActionOrigin.UserInput)?.dispatch();
        return;
      }
    }

    if (node.nextSibling?.isEmpty && !node.nextSibling?.isAtom) {
      const after = PinnedSelection.fromPin(Pin.toStartOf(node.nextSibling)!);
      if (app.selection.eq(after)) return;
      app.tr.select(after, ActionOrigin.UserInput)?.dispatch();

      return;
    }
    app.cmd.insert.after(node, "section")?.dispatch();
  };

  return (
    <div
      className="carbon-node-handle"
      data-target={node?.name}
      data-as={node?.attrs.html["data-as"]}
      data-drag-handle={node?.type.dragHandle}
      style={style}
    >
      <div
        className="carbon-add-handle"
        onClick={handleAddNode}
        onMouseDown={preventAndStop}
      >
        <HiOutlinePlus />
      </div>
      <div className="carbon-drag-handle" ref={ref} {...listeners}>
        <PiDotsSixVerticalBold />
      </div>
      {createPortal(<>{DragRectComp}</>, document.body)}
    </div>
  );
}
