import {
  RendererProps,
  useCarbon,
  useNodeActivated,
  useNodeSelected,
} from "@emrgen/carbon-react";
import { useSquareBoard } from "../context";
import { useCallback, useMemo, useRef, useState } from "react";
import { stop } from "@emrgen/carbon-core";

export const useBoardElement = (props: RendererProps) => {
  const { node } = props;
  const app = useCarbon();
  const board = useSquareBoard();
  const ref = useRef<any>();
  const [isEditable, setIsEditable] = useState(false);
  const { attributes: selectedAttributes, yes: isSelected } = useNodeSelected({
    node,
  });
  const { attributes: activeAttributes, yes: isActive } = useNodeActivated({
    node,
  });

  const isCanvasChild = node.parent?.name === "sqCanvas";

  const skipSecondClick = useCallback(
    (e: React.MouseEvent) => {
      if (isSelected) {
        stop(e);
      }
    },
    [isSelected],
  );

  const toggleCollapse = useCallback(
    (e: React.MouseEvent) => {
      stop(e);
      app.cmd.collapsible.toggle(node).Dispatch();
    },
    [app, node],
  );

  return useMemo(() => {
    return {
      attributes: {
        ...selectedAttributes,
        ...activeAttributes,
        style: {
          position: isCanvasChild ? "absolute" : "relative",
        },
      },
      listeners: {
        onClick: (e) => {
          stop(e);
          board.onClick(e, node);
        },
        onMouseDown: (e) => {
          stop(e);
          board.onMouseDown(e, node.id);
        },
      },
      toggleCollapse,
      skipSecondClick,
      isSelected,
      isActive,
    };
  }, [
    activeAttributes,
    board,
    isActive,
    isCanvasChild,
    isSelected,
    node,
    selectedAttributes,
    skipSecondClick,
    toggleCollapse,
  ]);
};
