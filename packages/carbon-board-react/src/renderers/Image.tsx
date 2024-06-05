import {
  CarbonBlock,
  CarbonNodeContent,
  RendererProps,
} from "@emrgen/carbon-react";
import { ImagePath } from "@emrgen/carbon-core";
import { useBoardElement } from "../hooks/useBoardElement";

export const Image = (props: RendererProps) => {
  const { node } = props;

  const { attributes, listeners, skipSecondClick, toggleCollapse, isSelected } =
    useBoardElement({ node });

  const imageSrc = node.props.get(ImagePath, "");

  return (
    <CarbonBlock
      node={node}
      custom={{
        ...attributes,
        ...listeners,
      }}
    >
      <div className={"sq-image"} onClick={skipSecondClick}>
        <img src={imageSrc} alt={node.textContent} />
      </div>
      <div className={"sq-image-caption"}>
        <CarbonNodeContent node={node} />
      </div>
    </CarbonBlock>
  );
};
