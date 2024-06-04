import {
  CarbonBlock,
  CarbonChildren,
  RendererProps,
  useCarbon,
  useNodeActivated,
  useNodeSelected,
} from "@emrgen/carbon-react";
import { useSquareBoard } from "../context";
import { useRef, useState } from "react";
import { stop } from "@emrgen/carbon-core";

export const SquareBoardItem = (props: RendererProps) => {
  const { node } = props;
  const app = useCarbon();
  const board = useSquareBoard();
  const ref = useRef<any>();
  const [isEditable, setIsEditable] = useState(false);
  const { attributes: selectedAttributes, yes: isSelected } = useNodeSelected({
    node,
  });
  const { attributes: activeAttributes, yes: isActive } = useNodeActivated({
    node,
  });

  const isCanvasChild = node.parent?.name === "sqCanvas";

  return (
    <CarbonBlock
      node={node}
      ref={ref}
      custom={{
        onClick: (e) => {
          stop(e);
          board.onClick(e, node);
        },
        onMouseDown: (e) => {
          stop(e);
          board.onMouseDown(e, node.id);
        },
        ...selectedAttributes,
        ...activeAttributes,
        style: {
          position: isCanvasChild ? "absolute" : "relative",
        },
      }}
    >
      <CarbonChildren node={node} />
    </CarbonBlock>
  );
};
