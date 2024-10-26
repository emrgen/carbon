import React, {
  ForwardedRef,
  forwardRef,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useBoard } from "../hook/useBoard";
import { useBoardOverlay } from "../hook/useOverlay";

const InnerBoardOverlay = (props, forwardedRef: ForwardedRef<any>) => {
  const { visible } = useBoardOverlay();

  const board = useBoard();
  const [selecting, setSelecting] = useState(false);

  useEffect(() => {
    const onSelectStart = () => setSelecting(true);
    const onSelectEnd = () => setSelecting(false);
    board.on("select:start", onSelectStart);
    board.on("select:end", onSelectEnd);

    return () => {
      board.off("select:start", onSelectStart);
      board.off("select:end", onSelectEnd);
    };
  }, [board]);

  const attrs = useMemo(() => {
    const classes = ["de-board--overlay"];
    if (selecting) classes.push("de-board--selecting");

    return {
      className: classes.join(" "),
      style: {
        display: visible ? "block" : "none",
      },
    };
  }, [selecting, visible]);

  return <div {...attrs} ref={forwardedRef}></div>;
};

export const BoardOverlay = forwardRef(InnerBoardOverlay);
