import React from "react";
import {
  CarbonBlock,
  CarbonNodeChildren,
  CarbonNodeContent,
  RendererProps,
  useNodeStateChange,
  useSelectionHalo,
} from "@emrgen/carbon-core";

export default function CollapsibleListComp(props: RendererProps) {
  const { node } = props;
  const {SelectionHalo} = useSelectionHalo(props);

  const beforeContent = (
    <div
      className="carbon-collapsible__control"
      contentEditable="false"
      suppressContentEditableWarning
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      {node.data.node?.isExpanded ? "▼" : "▶"}
    </div>
  );

  return (
    <CarbonBlock {...props}>
      <CarbonNodeContent
        node={node}
        beforeContent={beforeContent}
        // wrapper={{ contentEditable: false }}
        // custom={{ contentEditable: true }}
      />
      <CarbonNodeChildren node={node} />
      {SelectionHalo}
    </CarbonBlock>
  );
}
