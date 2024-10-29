import { useEffect, useState } from "react";
import { useBoard } from "../hook/useBoard";
import { SelectionGroup } from "./SelectionGroup";

export const BoardHelpers = ({ node }) => {
  const board = useBoard();
  const [showGroup, setShowGroup] = useState(false);

  // console.log(
  //   fromString(
  //     toCSS(compose(translate(100 - 50, 100 - 50 + 72), rotateDEG(45))),
  //   ),
  // );

  useEffect(() => {
    const onSelectionChanged = () => {
      setShowGroup(board.selectedNodes.size > 1);
    };

    board.on("selectionchanged", onSelectionChanged);
    return () => {
      board.off("selectionchanged", onSelectionChanged);
    };
  }, [board]);

  return <>{showGroup && <SelectionGroup />}</>;
};