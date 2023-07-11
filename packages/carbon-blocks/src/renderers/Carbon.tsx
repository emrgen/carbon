import {
  CarbonBlock,
  CarbonChildren,
  CarbonPlugin,
  RendererProps,
  CarbonPortal,
} from "@emrgen/carbon-core";

export const CarbonComp = (props: RendererProps) => {
  const { node } = props;

  return (
    <CarbonBlock node={node}>
      <CarbonChildren node={node} />
    </CarbonBlock>
  );
};
