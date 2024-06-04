import {
  CarbonBlock,
  CarbonChildren,
  RendererProps,
  useCarbon,
} from "@emrgen/carbon-react";
import { preventAndStop } from "@emrgen/carbon-core";
import { useCallback, useState } from "react";
import { SquareBoardState } from "../state/states";
import { SquareBoardContext } from "../context";

export const Board = (props: RendererProps) => {
  const { node } = props;
  const app = useCarbon();
  const [board] = useState(() => SquareBoardState.default(app));

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      preventAndStop(e);
      board.onBoardClick(e, node);
    },
    [board, node],
  );

  return (
    <SquareBoardContext.Provider value={board}>
      <CarbonBlock node={node} custom={{ onMouseDown: handleMouseDown }}>
        <CarbonChildren node={node} />
      </CarbonBlock>
    </SquareBoardContext.Provider>
  );
};
