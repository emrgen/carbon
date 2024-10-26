import { Node } from "@emrgen/carbon-core";
import { DndEvent } from "@emrgen/carbon-dragon";
import { useTrackDrag } from "@emrgen/carbon-dragon-react";
import {
  CarbonBlock,
  CarbonChildren,
  RendererProps,
  useCarbon,
} from "@emrgen/carbon-react";
import { useRef, useState } from "react";
import { SelectionGroup } from "../components/SelectionGroup";
import { DesignBoard } from "../core/DesignBoard";
import { BoardContext, useBoard } from "../hook/useBoard";
import { BoardOverlayProvider } from "../hook/useOverlay";
import { useRectSelector } from "../hook/useRectSelector";

export const DesignBoardComp = (props: RendererProps) => {
  const { node } = props;
  const app = useCarbon();
  const [board] = useState(() => new DesignBoard(app));

  return (
    <BoardContext board={board}>
      <BoardOverlayProvider>
        <DesignSelectionStage node={node} />
      </BoardOverlayProvider>
    </BoardContext>
  );
};

const DesignSelectionStage = (props: RendererProps) => {
  const { node } = props;
  const board = useBoard();
  const ref = useRef<any>();

  const { style, isSelecting } = useRectSelector(board);

  const { listeners } = useTrackDrag({
    node,
    ref,
    distance: 5,
    onDragStart(event: DndEvent) {
      board.onSelectionStart(event);
    },
    onDragMove(event: DndEvent) {
      board.onSelectionMove(event);
    },
    onDragEnd(event: DndEvent) {
      board.onSelectionEnd(event);
    },
    onMouseDown(node: Node, event: MouseEvent) {},
    onMouseUp(node: Node, event: DndEvent) {
      board.onMouseUp(node, event);
    },
  });

  return (
    <>
      <div
        className={
          "de-board-content " + (isSelecting ? "de-board--rect-selecting" : "")
        }
        {...listeners}
      >
        <CarbonBlock {...props} ref={ref}>
          <CarbonChildren node={node} />
        </CarbonBlock>
      </div>
      <div className={"de-board--selector"} style={style}></div>
      <SelectionGroup />
    </>
  );
};
