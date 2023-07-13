import { Optional } from "@emrgen/types";
import { useCombineListeners } from "../hooks/useCombineListeners";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useDndMonitor } from "../hooks/useDndMonitor";
import { useDraggableHandle } from "../hooks/useDraggable";
import { useDragRect } from "../hooks/useDragRect";
import { Node } from "@emrgen/carbon-core";
import { DndEvent } from "../types";

export interface FastDragHandleProps {
  node: Optional<Node>;
  style: any;
}

export const CarbonDragHandleId = "fast-drag-handle";

export default function DraggableHandle(props: FastDragHandleProps) {
  const { node, style } = props;

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

  return (
    <div
      className="carbon-drag-handle"
      data-target={node?.name}
      data-drag-handle={node?.type.dragHandle}
      style={style}
      {...listeners}
      ref={ref}
    >
      {createPortal(<>{DragRectComp}</>, document.body)}
    </div>
  );
}
