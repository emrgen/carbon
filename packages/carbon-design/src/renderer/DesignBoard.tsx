import {
  CarbonBlock,
  CarbonChildren,
  RendererProps,
  useCarbon,
} from "@emrgen/carbon-react";
import { useState } from "react";
import { DesignBoard } from "../core/DesignBoard";
import { BoardContext } from "../hook/useBoard";
import { useRectSelector } from "../hook/useRectSelector";

export const DesignBoardComp = (props: RendererProps) => {
  const { node } = props;
  const app = useCarbon();
  const [board] = useState(() => new DesignBoard(app));
  const { style, isSelecting } = useRectSelector(board);

  return (
    <BoardContext board={board}>
      <div
        className={
          "de-board-content " + (isSelecting ? "de-board--rect-selecting" : "")
        }
      >
        <CarbonBlock
          {...props}
          custom={{
            onMouseDown: board.onMouseDown,
            onMouseMove: board.onMouseMove,
            onMouseUp: board.onMouseUp,
          }}
        >
          <CarbonChildren node={node} />
        </CarbonBlock>
      </div>
      <div className={"de-board--selector"} style={style}></div>
    </BoardContext>
  );
};
