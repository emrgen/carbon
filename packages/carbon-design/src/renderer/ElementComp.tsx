import { CarbonNode, RendererProps } from "@emrgen/carbon-react";
import { useEffect } from "react";
import { useBoard } from "../hook/useBoard";

export const ElementComp = (props: RendererProps) => {
  const { node } = props;
  const board = useBoard();

  useEffect(() => {
    board.onMountElement(node);
    return () => {
      board.onUnmountElement(node);
    };
  }, [board, node]);

  return <CarbonNode node={node} />;
};