import {
  CarbonBlock,
  RendererProps,
  useSelectionHalo,
} from "@emrgen/carbon-react";
import React from "react";
import { ImageSrcPath } from "../plugin/Image";

export default function ImageComp(props: RendererProps) {
  const { node } = props;
  const { SelectionHalo } = useSelectionHalo(props);
  const imageSrc = node.props.get(ImageSrcPath, "");

  return (
    <CarbonBlock {...props}>
      <div className="image-container">
        {!imageSrc && <div className="image-overlay">Image</div>}
        <img src={imageSrc} alt="alt text" />
        {SelectionHalo}
      </div>
    </CarbonBlock>
  );
}
