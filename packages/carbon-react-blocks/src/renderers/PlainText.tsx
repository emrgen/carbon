import {
  CarbonBlock,
  CarbonChildren,
  RendererProps,
} from "@emrgen/carbon-react";

export const PlainText = (props: RendererProps) => {
  const { node } = props;

  return (
    <CarbonBlock node={node}>
      <CarbonChildren node={node} />
    </CarbonBlock>
  );
};