import { RendererProps } from "@emrgen/carbon-react";
import { useEffect } from "react";
import { useBoard } from "./useBoard";

export const useElement = (props: RendererProps) => {
  const { node } = props;
  const board = useBoard();

  useEffect(() => {
    board.onMountElement(node);
    return () => {
      board.onUnmountElement(node);
    };
  }, [board, node]);
};