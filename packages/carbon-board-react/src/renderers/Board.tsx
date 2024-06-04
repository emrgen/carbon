import {
  CarbonBlock,
  CarbonNodeContent,
  RendererProps,
  useNodeActivated,
  useNodeSelected,
} from "@emrgen/carbon-react";
import { BackgroundImagePath, stop } from "@emrgen/carbon-core";
import { useSquareBoard } from "../context";
import { useCallback, useRef } from "react";
import { CardsCountPath } from "@emrgen/carbon-board";

export const Board = (props: RendererProps) => {
  const { node } = props;
  const board = useSquareBoard();
  const ref = useRef<any>();
  const { attributes: selectedAttributes, yes: isSelected } = useNodeSelected({
    node,
  });
  const { attributes: activeAttributes, yes: isActive } = useNodeActivated({
    node,
  });

  const image = node.props.get(BackgroundImagePath, "");
  // const title = node.props.get(TitlePath, "");
  const cardsCount = node.props.get(CardsCountPath, 0);

  const handleIconClick = useCallback(
    (e: React.MouseEvent) => {
      if (isSelected) {
        stop(e);
      }
    },
    [isSelected],
  );

  return (
    <CarbonBlock
      node={node}
      ref={ref}
      custom={{
        onClick: (e) => board.onClick(e, node),
        onMouseDown: (e) => {
          stop(e);
          board.onMouseDown(e, node.id);
        },
        ...selectedAttributes,
        ...activeAttributes,
      }}
    >
      <div
        style={{ backgroundImage: `url(${image})` }}
        className={"sq-board-icon"}
        onClick={handleIconClick}
      />
      <div className={"sq-board-header"}>
        <div
          className={"sq-board-title"}
          data-untitled={node.firstChild!.isEmpty}
        >
          <CarbonNodeContent node={node} />
        </div>
        <div
          className={"sq-board-info"}
          contentEditable={false}
          onClick={(e) => {
            if (isSelected) stop(e);
          }}
        >
          {cardsCount} Card {cardsCount > 1 ? "s" : ""}
        </div>
      </div>
    </CarbonBlock>
  );
};
