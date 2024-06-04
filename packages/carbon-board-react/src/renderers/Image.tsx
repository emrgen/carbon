import {
  CarbonBlock,
  CarbonNodeContent,
  RendererProps,
  useCarbon,
  useNodeActivated,
  useNodeSelected,
} from "@emrgen/carbon-react";
import { useSquareBoard } from "../context";
import { ImagePath, stop } from "@emrgen/carbon-core";
import { useCallback } from "react";

export const Image = (props: RendererProps) => {
  const { node } = props;
  const app = useCarbon();
  const board = useSquareBoard();

  const { attributes: selectedAttributes, yes: isSelected } = useNodeSelected({
    node,
  });
  const { attributes: activeAttributes, yes: isActive } = useNodeActivated({
    node,
  });

  const imageSrc = node.props.get(ImagePath, "");
  const isCanvasChild = node.parent?.name === "sqCanvas";

  const handleSelectImage = useCallback(
    (e) => {
      if (isSelected) {
        stop(e);
      }
    },
    [isSelected],
  );

  return (
    <CarbonBlock
      node={node}
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
      <div className={"sq-image"} onClick={handleSelectImage}>
        <img src={imageSrc} alt={node.textContent} />
      </div>
      <div className={"sq-image-caption"}>
        <CarbonNodeContent node={node} />
      </div>
    </CarbonBlock>
  );
};
