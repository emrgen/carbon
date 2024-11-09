import {
  CarbonBlock,
  RendererProps,
  useSelectionHalo,
} from "@emrgen/carbon-react";
import React from "react";

export function VideoComp(props: RendererProps) {
  const { SelectionHalo, attributes, isSelected } = useSelectionHalo(props);

  return (
    <CarbonBlock {...props} custom={{ contentEditable: false }}>
      <div className="video-container">
        <div className="video-overlay" style={{ color: "crimson" }}>
          No <b>video</b> renderer is registered
        </div>
      </div>
      {SelectionHalo}
    </CarbonBlock>
  );
}
