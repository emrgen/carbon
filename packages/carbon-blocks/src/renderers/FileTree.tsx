import {
  CarbonBlock,
  CarbonChildren,
  RendererProps,
  preventAndStop
} from "@emrgen/carbon-core";

export const FileTreeComp = (props: RendererProps) => {
  const { node } = props;

  return (
    <CarbonBlock node={node} custom={{onMouseDown: preventAndStop}}>
      <CarbonChildren node={node} />
    </CarbonBlock>
  );
};
