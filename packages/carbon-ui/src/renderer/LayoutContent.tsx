import {
  CarbonBlock,
  CarbonChildren,
  RendererProps,
} from "@emrgen/carbon-react";

export const LayoutContentComp = (props: RendererProps) => {
  const { node } = props;

  return (
    <CarbonBlock {...props}>
      <CarbonChildren node={node} />
    </CarbonBlock>
  );
};