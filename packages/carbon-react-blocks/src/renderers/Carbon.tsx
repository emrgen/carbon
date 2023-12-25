import {
  RendererProps,
} from "@emrgen/carbon-core";
import {CarbonBlock, CarbonChildren} from "@emrgen/carbon-react";

export const CarbonComp = (props: RendererProps) => {
  const { node } = props;

  return (
    <CarbonBlock node={node}>
      <CarbonChildren node={node} />
    </CarbonBlock>
  );
};
