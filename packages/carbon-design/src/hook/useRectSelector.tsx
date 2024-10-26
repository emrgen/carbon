import { CSSProperties, useEffect, useState } from "react";
import { DesignBoard, SelectEvent } from "../core/DesignBoard";
import { abs, min } from "../utils";

export const useRectSelector = (board: DesignBoard) => {
  const [style, setStyle] = useState<CSSProperties>({});
  const [isSelecting, setIsSelecting] = useState(false);

  useEffect(() => {
    const onSelectStart = (e: SelectEvent) => {
      setStyle({
        display: "block",
        position: "absolute",
        left: e.x,
        top: e.y,
        width: 0,
        height: 0,
        border: "1px dashed #000",
        pointerEvents: "none",
      });
      setIsSelecting(true);
    };

    const onSelectMove = (e: SelectEvent) => {
      setStyle((style) => ({
        ...style,
        left: min(e.x, e.ix),
        top: min(e.y, e.iy),
        width: abs(e.x - e.ix),
        height: abs(e.y - e.iy),
      }));
    };

    const onSelectEnd = (e: SelectEvent) => {
      setStyle({
        display: "none",
      });
      setIsSelecting(false);
    };

    board.on("select:start", onSelectStart);
    board.on("select:move", onSelectMove);
    board.on("select:end", onSelectEnd);

    return () => {
      board.off("select:start", onSelectStart);
      board.off("select:move", onSelectMove);
      board.off("select:end", onSelectEnd);
    };
  }, [board]);

  return {
    style,
    isSelecting,
  };
};