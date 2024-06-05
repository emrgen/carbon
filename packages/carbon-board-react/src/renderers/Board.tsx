import {
  CarbonBlock,
  CarbonNodeContent,
  RendererProps,
} from "@emrgen/carbon-react";
import { BackgroundImagePath, stop } from "@emrgen/carbon-core";
import { useSquareBoard } from "../context";
import { useCallback, useRef } from "react";
import { CardsCountPath } from "@emrgen/carbon-board";
import { useBoardElement } from "../hooks/useBoardElement";

export const Board = (props: RendererProps) => {
  const { node } = props;
  const board = useSquareBoard();
  const ref = useRef<any>();
  const { attributes, listeners, skipSecondClick, toggleCollapse, isSelected } =
    useBoardElement({ node });

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
        ...attributes,
        ...listeners,
      }}
    >
      <div
        style={{ backgroundImage: `url(${image})` }}
        className={"sq-board-icon"}
        onClick={skipSecondClick}
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
          onClick={skipSecondClick}
        >
          {cardsCount} Card {cardsCount > 1 ? "s" : ""}
        </div>
      </div>
    </CarbonBlock>
  );
};
