import { CarbonBlock, CarbonNode, RendererProps, useCarbon } from "@emrgen/carbon-react";
import { useRef, useState } from "react";
import { RectSelector } from "../components/RectSelector";
import { DesignBoard } from "../core/DesignBoard";
import { BoardContext } from "../hook/useBoard";
import { BoardOverlayProvider } from "../hook/useOverlay";

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
  const ref = useRef<any>();

  return (
    <>
      <div className={"de-board-content"}>
        <CarbonBlock {...props} ref={ref}>
          <RectSelector node={node} />
          {node.children.slice(0, 2).map((child) => {
            return <CarbonNode node={child} key={child.key} />;
          })}
          {/*<CarbonChildren node={node} />*/}
        </CarbonBlock>
        {/*<DoubleBound node={node} />*/}
        {/*<BoardHelpers node={node} />*/}
      </div>
    </>
  );
};
