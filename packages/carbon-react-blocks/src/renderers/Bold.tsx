import React, { useRef } from "react";
import {
  CarbonBlock,
  CarbonChildren,
  RendererProps,
} from "@emrgen/carbon-react";

export function BoldComp(props: RendererProps) {
  const { node } = props;
  const ref = useRef(null);

  return (
    <CarbonBlock {...props} ref={ref}>
      <CarbonChildren node={node} />
    </CarbonBlock>
  );
}
