import { DndEvent } from "@emrgen/carbon-dragon";
import { CSSProperties, useEffect, useState } from "react";
import { DesignBoard, SelectEvent } from "../core/DesignBoard";
import { abs, min } from "../utils";

export const useRectSelector = (board: DesignBoard) => {
  const [style, setStyle] = useState<CSSProperties>({});
  const [isSelecting, setIsSelecting] = useState(false);

  useEffect(() => {
    const onSelectStart = (e: DndEvent) => {
      setStyle({
        display: "block",
        position: "absolute",
        left: e.position.startX,
        top: e.position.startY,
        width: 0,
        height: 0,
        border: "1px dashed #000",
        pointerEvents: "none",
      });
      setIsSelecting(true);
    };

    const onSelectMove = (e: DndEvent) => {
      const { position: p } = e;
      setStyle((style) => ({
        ...style,
        left: min(p.startX, p.endX),
        top: min(p.startY, p.endY),
        width: abs(p.startX - p.endX),
        height: abs(p.startY - p.endY),
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