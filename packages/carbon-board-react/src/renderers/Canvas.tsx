import {
  CarbonBlock,
  CarbonChildren,
  RendererProps,
  useCarbon,
} from "@emrgen/carbon-react";
import { preventAndStop, stop } from "@emrgen/carbon-core";
import { useCallback, useState } from "react";
import { SquareBoardState } from "../state/BoardState";
import { SquareBoardContext } from "../context";

export const Canvas = (props: RendererProps) => {
  const { node } = props;
  const app = useCarbon();
  const [board] = useState(() => SquareBoardState.default(app));

  const handleMouseDown = useCallback(
    (e) => {
      preventAndStop(e);
      board.onBoardClick(e, node);
    },
    [board, node],
  );

  return (
    <SquareBoardContext.Provider value={board}>
      <CarbonBlock
        node={node}
        custom={{
          onMouseDown: handleMouseDown,
          onMouseMove: stop,
          onMouseOver: stop,
          onMouseOut: stop,
          onMouseUp: stop,
          onClick: stop,
        }}
      >
        <CarbonChildren node={node} />
      </CarbonBlock>
    </SquareBoardContext.Provider>
  );
};
