import { CSSProperties, useEffect, useState } from "react";
import { useBoard } from "../hook/useBoard";

interface SelectionGroupProps {}

export const SelectionGroup = (props: SelectionGroupProps) => {
  const board = useBoard();
  const [style, setStyle] = useState<CSSProperties>({});

  useEffect(() => {
    const onSelectEnd = () => {
      if (board.selectedNodes.size > 1) {
        const bounds = board.selectedNodesBound;
        setStyle({
          left: bounds.minX - 2,
          top: bounds.minY - 2,
          width: bounds.maxX - bounds.minX + 4,
          height: bounds.maxY - bounds.minY + 4,
        });
      } else {
        setStyle({ display: "none" });
      }
    };

    board.on("select:end", onSelectEnd);

    return () => {
      board.off("select:end", onSelectEnd);
    };
  }, [board]);

  return <div className="de-board--selection-group" style={style}></div>;
};