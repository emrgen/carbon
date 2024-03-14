import { useCallback, useEffect, useMemo, useState } from "react";
import { RectSelectorContext } from "../hooks/useRectSelector";
import { Carbon, State, EventsOut, Transaction } from "@emrgen/carbon-core";
import { createPortal } from "react-dom";
import { useDndMonitor, useDragRect } from "../hooks";
import { throttle } from "lodash";
import { CarbonDragHandleId } from "./DraggableHandle";
import {useCarbon} from "@emrgen/carbon-react";
import {DndEvent, RectSelect, RectSelectAreaId} from "@emrgen/carbon-dragon";

export function RectSelectContext(props) {
  const app = useCarbon();
  const [rectSelector] = useState(() => new RectSelect(app));
  const { DragRectComp, onDragRectProgress, onDragRectStop } = useDragRect({
    overlay: true,
  });

  const [isSelecting, setIsSelecting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isBlockSelection, setIsBlockSelection] = useState(false);

  // mark the rect-selector dirty when the content changes
  useEffect(() => {
    const onChanged = (state: State) => {
      // console.log('####################1')
      setIsBlockSelection(state.blockSelection.isActive)
    };

    const onSelectStart = (e) => {
      // console.log('####################2')
      // setIsBlockSelection(false)
    }

    app.on(EventsOut.changed, onChanged);
    // app.on('selectstart', onSelectStart)
    return () => {
      app.off(EventsOut.changed, onChanged);
      // app.off('selectstart', onSelectStart)
    };
  }, [app, rectSelector]);

  const onDragStart = useCallback(
    (e: DndEvent) => {
      if (e.id === RectSelectAreaId) {
        e.event.preventDefault();
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
    const throttledHandler = throttle((e: DndEvent) => {
      const { id } = e;
      // make sure the origin of the event is a rect-select-area
      if (id === RectSelectAreaId) {
        onDragRectProgress(e);
        rectSelector.onDragMove(e);
      }
    }, 10);

    return (e: DndEvent) => {
      e.event.preventDefault();
      throttledHandler(e);
    }
  }, [onDragRectProgress, rectSelector]);

  const onDragEnd = useCallback(
    (e: DndEvent) => {
      if (e.id === RectSelectAreaId) {
        rectSelector.onDragEnd(e);
        e.event.preventDefault();
        onDragRectStop(e);
        setIsSelecting(false);
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
      if (app.state.blockSelection.isActive) return;
      // setIsSelecting(false);
    };

    rectSelector.on("mouse:down", onMouseDown);
    rectSelector.on("mouse:up", onMouseUp);

    return () => {
      rectSelector.off("mouse:down", onMouseDown);
      rectSelector.off("mouse:up", onMouseUp);
    };
  }, [app, rectSelector]);


  useEffect(() => {
    const onHideCursor = () => {
      setIsSelecting(true);
      // console.log('hide cursor');

    }
    const onShowCursor = () => {
      // console.log("show cursor");
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
          "carbon-selection" +
          (isSelecting ? " carbon-selecting" : "") +
          (isDragging ? " rect-dragging" : "") +
          (isBlockSelection ? " block-selection" : "")
        }
      >
        {props.children}
        {/* <RectSelectController /> */}
      </div>
      {createPortal(<>{DragRectComp}</>, document.body)}
    </RectSelectorContext>
  );
}
