import { RendererProps } from "@emrgen/carbon-react";

// ReactiveCellEditor component for editing cell content or results of the cell
export const ReactiveCellViewer = (props: RendererProps) => {
  const { node } = props;

  return (
    <div className={"carbon-reactive-cell-viewer"}>
      <div className={"carbon-reactive-cell-viewer-content"}>Cell Viewer for {node.name}</div>
    </div>
  );
};
