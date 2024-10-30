import { EventEmitter } from "events";
import React, { useEffect, useMemo, useState } from "react";
import { useBoard } from "../hook/useBoard";

export interface BoardOverlayProps {
  bus: EventEmitter;
}

export const BoardOverlay = (props: BoardOverlayProps) => {
  const { bus } = props;
  const board = useBoard();
  const [visible, setVisible] = useState(false);
  const [selecting, setSelecting] = useState(false);

  useEffect(() => {
    const onShow = () => setVisible(true);
    const onHide = () => setVisible(false);
    bus.on("show", onShow);
    bus.on("hide", onHide);

    return () => {
      bus.off("show", onShow);
      bus.off("hide", onHide);
    };
  }, [bus]);

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
        opacity: visible ? 1 : 0,
        zIndex: visible ? 100 : -1,
      },
    };
  }, [selecting, visible]);

  return <div {...attrs}></div>;
};
