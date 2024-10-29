import { Node } from "@emrgen/carbon-core";
import { DndEvent } from "@emrgen/carbon-dragon";
import { useMakeDraggable } from "@emrgen/carbon-dragon-react";
import { useRef } from "react";
import { useBoard } from "../hook/useBoard";
import { useBoardOverlay } from "../hook/useOverlay";
import { useRectSelector } from "../hook/useRectSelector";

export const RectSelector = ({ node }) => {
  const board = useBoard();
  const ref = useRef<any>();
  const rectRef = useRef<any>();
  const overlay = useBoardOverlay();

  const { style, isSelecting } = useRectSelector(board, rectRef);

  const { listeners } = useMakeDraggable({
    node,
    ref,
    distance: 5,
    onDragStart(event: DndEvent) {
      board.onSelectionStart(event);
      overlay.showOverlay();
    },
    onDragMove(event: DndEvent) {
      board.onSelectionMove(event);
    },
    onDragEnd(event: DndEvent) {
      board.onSelectionEnd(event);
      overlay.hideOverlay();
    },
    onMouseDown(node: Node, event: MouseEvent) {},
    onMouseUp(node: Node, event: DndEvent) {
      board.onMouseUp(node, event);
    },
  });

  return (
    <div
      ref={ref}
      className={
        "de-board--selection-area " +
        (isSelecting ? "de-board--rect-selecting" : "")
      }
      {...listeners}
    >
      <div className={"de-board--selector"} style={style} ref={rectRef}></div>
    </div>
  );
};