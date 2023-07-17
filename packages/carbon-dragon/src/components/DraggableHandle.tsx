import { Optional } from "@emrgen/types";
import { useCombineListeners } from "../hooks/useCombineListeners";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useDndMonitor } from "../hooks/useDndMonitor";
import { useDraggableHandle } from "../hooks/useDraggable";
import { useDragRect } from "../hooks/useDragRect";
import { Node, useCarbon } from "@emrgen/carbon-core";
import { DndEvent } from "../types";
import { HiOutlinePlus } from 'react-icons/hi';
import { PiDotsSixVerticalBold } from 'react-icons/pi';

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

  useDndMonitor({
    onDragMove,
    onDragEnd,
  });

  const handleAddNode = () => {
    if (!node) return;
    app.cmd.insert.after(node, 'section')?.dispatch();
  }

  return (
    <div
      className="carbon-node-handle"
      data-target={node?.name}
      data-drag-handle={node?.type.dragHandle}
      style={style}
    >
      <div className="carbon-add-handle" onClick={handleAddNode}>
        <HiOutlinePlus />
      </div>
      <div className="carbon-drag-handle" ref={ref} {...listeners}>
        <PiDotsSixVerticalBold />
      </div>
      {createPortal(<>{DragRectComp}</>, document.body)}
    </div>
  );
}
