import { CarbonBlock, RendererProps } from "@emrgen/carbon-react";
import { useEffect } from "react";
import { ElementTransformer } from "../components/Resizer";
import { useBoard } from "../hook/useBoard";

export const DesignElement = (props: RendererProps) => {
  const { node } = props;
  const board = useBoard();

  useEffect(() => {
    board.onMountElement(node);
    return () => {
      board.onUnmountElement(node);
    };
  }, [board, node]);

  return (
    <CarbonBlock {...props} custom={{}}>
      <ElementTransformer node={node} />
    </CarbonBlock>
  );
};