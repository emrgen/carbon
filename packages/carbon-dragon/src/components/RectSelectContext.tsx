import { useCallback, useEffect, useMemo, useState } from "react";
import { RectSelect } from "../core/RectSelect";
import { RectSelectorContext } from "../hooks/useRectSelector";
import { Carbon, CarbonState, EventsOut, RendererProps, Transaction, useCarbon } from "@emrgen/carbon-core";
import { createPortal } from "react-dom";
import { useDndMonitor, useDragRect } from "../hooks";
import { DndEvent } from "../types";
import { RectSelectAreaId } from "../constants";
import { throttle } from "lodash";
import { CarbonDragHandleId } from "./DraggableHandle";

export function RectSelectContext(props: RendererProps) {
  const { node } = props;
  const app = useCarbon();
  const [rectSelector] = useState(() => new RectSelect(app));
  const { DragRectComp, onDragRectProgress, onDragRectStop } = useDragRect({
    overlay: true,
  });

  const [isSelecting, setIsSelecting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // mark the rect-selector dirty when the content changes
  useEffect(() => {
    const onChanged = (state: CarbonState) => {
      if (state.changes.isLocalStateDirty) {
        rectSelector.markDirty();
      }
    };

    app.on(EventsOut.changed, onChanged);
    return () => {
      app.off(EventsOut.changed, onChanged);
    };
  }, [app, rectSelector]);

  const onDragStart = useCallback(
    (e: DndEvent) => {
      if (e.id === RectSelectAreaId) {
        rectSelector.onDragStart(e);
        setIsSelecting(true);
      }

      if (e.id === CarbonDragHandleId) {
        setIsDragging(true);
      }
    },
    [rectSelector]
  );

  // select nodes based on the drag rect
  const onDragMove = useMemo(() => {
    return throttle((e: DndEvent) => {
      const { id } = e;
      // make sure the origin of the event is a rect-select-area
      if (id === RectSelectAreaId) {
        onDragRectProgress(e);
        rectSelector.onDragMove(e);
      }
    }, 10);
  }, [onDragRectProgress, rectSelector]);

  const onDragEnd = useCallback(
    (e: DndEvent) => {
      if (e.id === RectSelectAreaId) {
        rectSelector.onDragEnd(e);
        // app.enable();
        onDragRectStop(e);
        if (!app.selection.isBlock) {
          setIsSelecting(false);
        }
      }

      if (e.id === CarbonDragHandleId) {
        setIsDragging(false);
      }
    },
    [app.selection, onDragRectStop, rectSelector]
  );

  useDndMonitor({
    onDragStart,
    onDragMove,
    onDragEnd,
  });

  useEffect(() => {
    const onMouseDown = (e) => {
      setIsSelecting(true);
    };

    const onMouseUp = (e) => {
      // if there is a block selection, keep the rect-select active
      if (app.selection.isBlock) return;
      // setIsSelecting(false);
    };

    rectSelector.on("mouse:down", onMouseDown);
    rectSelector.on("mouse:up", onMouseUp);

    return () => {
      rectSelector.off("mouse:down", onMouseDown);
      rectSelector.off("mouse:up", onMouseUp);
    };
  }, [app.selection, rectSelector]);


  useEffect(() => {
    const onHideCursor = () => {
      setIsSelecting(true);
      console.log('hide cursor');

    }
    const onShowCursor = () => {
      console.log("show cursor");
      setIsSelecting(false);
    }

    app.on("document:cursor:hide", onHideCursor);
    app.on("document:cursor:show", onShowCursor);

    return () => {
      app.off("document:cursor:hide", onHideCursor);
      app.off("document:cursor:show", onShowCursor);
    };
  }, [app]);

  return (
    <RectSelectorContext value={rectSelector}>
      <div
        className={
          "carbon-rect-select" +
          (isSelecting ? " rect-active" : "") +
          (isDragging ? " rect-dragging" : "")
        }
      >
        {props.children}
        {/* <RectSelectController /> */}
      </div>
      {createPortal(<>{DragRectComp}</>, document.body)}
    </RectSelectorContext>
  );
}
