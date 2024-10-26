import {
  CarbonBlock,
  CarbonChildren,
  RendererProps,
  useCarbon,
} from "@emrgen/carbon-react";
import { useState } from "react";
import { DesignBoard } from "../core/DesignBoard";
import { BoardContext } from "../hook/useBoard";

export const DesignBoardComp = (props: RendererProps) => {
  const { node } = props;
  const app = useCarbon();
  const [board] = useState(() => new DesignBoard(app));

  return (
    <BoardContext board={board}>
      <CarbonBlock {...props}>
        <CarbonChildren node={node} />
      </CarbonBlock>
    </BoardContext>
  );
};
