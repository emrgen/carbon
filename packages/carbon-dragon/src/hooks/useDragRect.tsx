import { Optional, RawPoint } from "@emrgen/types";
import { useCallback, useState } from "react";
import { boundFromPoints, pointsFromFastDndEvent } from "../core/utils";
import { DndEvent } from "../types";
import { prevent, preventAndStop } from "@emrgen/carbon-core";

const { min, max, abs } = Math;
interface UseDragRectProps {
  offset?: number;
  overlay?: boolean;
  cursorPos?: boolean;
}

interface RectProps {
  left: number;
  top: number;
  width: number;
  height: number;
}

export const useDragRect = (props?: UseDragRectProps) => {
  const { overlay = false, cursorPos = false } = props ?? {};
  const [dragRect, setDragRect] = useState<Optional<RectProps>>(null);
  const [cursorPoint, setCursorPoint] = useState<Optional<RawPoint>>(null);

  const isDragging = !!dragRect;
  const DragRectComp = (
    <>
      {isDragging && (
        <>
          {overlay && (
            <div
              style={dragRect ?? {}}
              className="carbon-selector"
              onMouseUp={stop}
            />
          )}

          {/* <div className="carbon-drag-overlay" onMouseMove={prevent} /> */}

          {cursorPos && (
            <div
              style={{ left: cursorPoint?.x ?? 0, top: cursorPoint?.y ?? 0 }}
              className="drag-handle-hint"
            />
          )}
        </>
      )}
    </>
  );

  const onDragRectProgress = useCallback((e: DndEvent) => {
    const {sp, ep} = pointsFromFastDndEvent(e)
    setDragRect(boundFromPoints(sp, ep));
    setCursorPoint(ep);
  }, []);

  const onDragRectStop = useCallback((e) => {
    setDragRect(null);
  }, []);

  return {
    dragRect,
    DragRectComp,
    onDragRectProgress,
    onDragRectStop,
    isDragging,
  };
};
