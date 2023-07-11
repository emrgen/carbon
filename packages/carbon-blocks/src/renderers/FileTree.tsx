import {
  CarbonBlock,
  CarbonChildren,
  RendererProps
} from "@emrgen/carbon-core";

export const FileTreeComp = (props: RendererProps) => {
  const { node } = props;

  return (
    <CarbonBlock node={node}>
      <CarbonChildren node={node} />
    </CarbonBlock>
  );
};
