import {
  CarbonBlock,
  CarbonNodeChildren,
  CarbonNodeContent,
  RendererProps,
  useCarbon,
  useNodeActivated,
  useNodeSelected,
} from "@emrgen/carbon-react";
import { useSquareBoard } from "../context";
import { useCallback, useRef } from "react";
import { stop } from "@emrgen/carbon-core";
import { CardsCountPath } from "@emrgen/carbon-board";

export const Column = (props: RendererProps) => {
  const { node } = props;
  const app = useCarbon();
  const board = useSquareBoard();
  const ref = useRef<any>();
  const { attributes: selectedAttributes, yes: isSelected } = useNodeSelected({
    node,
  });
  const { attributes: activeAttributes, yes: isActive } = useNodeActivated({
    node,
  });

  const isCanvasChild = node.parent?.name === "sqCanvas";
  const cardsCount = node.props.get(CardsCountPath, 0);

  const handleToggleCollapse = useCallback(
    (e: React.MouseEvent) => {
      stop(e);
      app.cmd.collapsible.toggle(node).Dispatch();
    },
    [app, node],
  );

  return (
    <CarbonBlock
      node={node}
      ref={ref}
      custom={{
        onClick: (e) => {
          stop(e);
          board.onClick(e, node);
        },
        onMouseDown: (e) => {
          stop(e);
          board.onMouseDown(e, node.id);
        },
        ...selectedAttributes,
        ...activeAttributes,
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
            onClick={handleToggleCollapse}
          >
            -
          </div>
        </div>
        <div className={"sq-column-info"}>
          {cardsCount} Card {cardsCount > 1 ? "s" : ""}
        </div>
      </div>
      <div className={"sq-column-content"} data-content-empty={node.size <= 1}>
        <CarbonNodeChildren node={node} />
      </div>
    </CarbonBlock>
  );
};
