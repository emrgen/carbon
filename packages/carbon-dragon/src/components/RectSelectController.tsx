import { State, EventsOut, Transaction} from "@emrgen/carbon-core";
import { throttle } from "lodash";
import { useCallback, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { RectSelectAreaId } from "../constants";
import { useDndMonitor } from "../hooks/useDndMonitor";
import { useDragRect } from "../hooks/useDragRect";
import { useRectSelector } from "../hooks/useRectSelector";
import { DndEvent } from "../types";
//
// export const RectSelectController = () => {
//   const react = useCarbon();
//   const rectSelector = useRectSelector();
//   const { DragRectComp, onDragRectProgress, onDragRectStop } = useDragRect({
//     overlay: true,
//   });
//
//   // mark the rect-selector dirty when the content changes
//   useEffect(() => {
//     const onChanged = (state: CarbonState) => {
//       if (state.changes.isContentDirty) {
//         rectSelector.markDirty();
//       }
//     };
//
//     react.on(EventsOut.changed, onChanged);
//     return () => {
//       react.off(EventsOut.changed, onChanged);
//     };
//   }, [react, rectSelector]);
//
//   const onDragStart = useCallback(
//     (e: DndEvent) => {
//       if (e.id === RectSelectAreaId) {
//         rectSelector.onDragStart(e);
//         // react.disable();
//       }
//     },
//     [rectSelector]
//   );
//
//   // select nodes based on the drag rect
//   const onDragMove = useMemo(() => {
//     return throttle((e: DndEvent) => {
//       const { id } = e;
//       // make sure the origin of the event is a rect-select-area
//       if (id === RectSelectAreaId) {
//         onDragRectProgress(e);
//         rectSelector.onDragMove(e);
//       }
//     }, 10);
//   }, [onDragRectProgress, rectSelector]);
//
//   const onDragEnd = useCallback(
//     (e: DndEvent) => {
//       if (e.id === RectSelectAreaId) {
//         rectSelector.onDragEnd(e);
//         react.enable();
//         onDragRectStop(e);
//       }
//     },
//     [react, onDragRectStop, rectSelector]
//   );
//
//   useDndMonitor({
//     onDragStart,
//     onDragMove,
//     onDragEnd,
//   });
//
//   return <>{createPortal(<>{DragRectComp}</>, document.body)}</>;
// };
