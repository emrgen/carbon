import {
  CarbonBlock,
  CarbonNodeChildren,
  CarbonNodeContent,
  RendererProps,
  useCarbon,
} from "@emrgen/carbon-react";
import { useSquareBoard } from "../context";
import { useRef } from "react";
import { CardsCountPath } from "@emrgen/carbon-board";
import { useBoardElement } from "../hooks/useBoardElement";

export const Column = (props: RendererProps) => {
  const { node } = props;
  const app = useCarbon();
  const board = useSquareBoard();
  const ref = useRef<any>();
  const { attributes, listeners, skipSecondClick, toggleCollapse, isSelected } =
    useBoardElement({ node });
  const cardsCount = node.props.get(CardsCountPath, 0);

  return (
    <CarbonBlock
      node={node}
      ref={ref}
      custom={{
        ...attributes,
        ...listeners,
        "data-collapsed": node.isCollapsed,
      }}
    >
      <div className={"sq-column-header"}>
        <div
          className={"sq-column-title"}
          data-untitled={node.firstChild!.isEmpty}
        >
          <CarbonNodeContent node={node} />
          <div
            className={"sq-column-collapse-button"}
            contentEditable={false}
            suppressContentEditableWarning={true}
            onClick={toggleCollapse}
          >
            -
          </div>
        </div>
        <div
          className={"sq-column-info"}
          contentEditable={false}
          onClick={skipSecondClick}
        >
          {cardsCount} Card{cardsCount > 1 ? "s" : ""}
        </div>
      </div>
      <div className={"sq-column-content"} data-content-empty={node.size <= 1}>
        <CarbonNodeChildren node={node} />
      </div>
    </CarbonBlock>
  );
};
