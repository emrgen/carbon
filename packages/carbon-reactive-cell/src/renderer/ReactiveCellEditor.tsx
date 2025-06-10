import { RendererProps } from "@emrgen/carbon-react";

// ReactiveCellEditor component for editing cell code or content
export const ReactiveCellEditor = (props: RendererProps) => {
  const { node } = props;

  return (
    <div className={"carbon-reactive-cell-editor"}>
      <div className={"carbon-reactive-cell-editor-content"}></div>
    </div>
  );
};
