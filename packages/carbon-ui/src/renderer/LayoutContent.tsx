import {
  CarbonBlock,
  CarbonChildren,
  RendererProps,
} from "@emrgen/carbon-react";
import { PathTracker } from "@emrgen/carbon-utils";

export const LayoutContentComp = (props: RendererProps) => {
  const { node } = props;

  return (
    <CarbonBlock {...props}>
      <CarbonChildren node={node} />
      <PathTracker />
    </CarbonBlock>
  );
};