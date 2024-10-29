import { DndEvent } from "@emrgen/carbon-dragon";
import { CSSProperties, useEffect, useState } from "react";
import { DesignBoard, SelectEvent } from "../core/DesignBoard";
import { abs, min } from "../utils";

export const useRectSelector = (
  board: DesignBoard,
  rectRef: React.MutableRefObject<any>,
) => {
  const [style, setStyle] = useState<CSSProperties>({});
  const [isSelecting, setIsSelecting] = useState(false);

  useEffect(() => {
    const onSelectStart = (e: DndEvent) => {
      if (rectRef.current) {
        rectRef.current;
      }
      setStyle({
        display: "block",
        position: "absolute",
        left: e.position.startX,
        top: e.position.startY,
        width: 0,
        height: 0,
        pointerEvents: "none",
        opacity: 1,
      });
      setIsSelecting(true);
    };

    const onSelectMove = (e: DndEvent) => {
      const { position: p } = e;
      if (rectRef.current) {
        rectRef.current.style.left = min(p.startX, p.endX) + "px";
        rectRef.current.style.top = min(p.startY, p.endY) + "px";
        rectRef.current.style.width = abs(p.startX - p.endX) + "px";
        rectRef.current.style.height = abs(p.startY - p.endY) + "px";
      }
    };

    const onSelectEnd = (e: SelectEvent) => {
      setStyle({
        opacity: 0,
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
  }, [board, rectRef]);

  return {
    style,
    isSelecting,
  };
};