import React from "react";
import {
  CarbonBlock,
  CarbonChildren,
  RendererProps,
  useCarbon,
} from "@emrgen/carbon-react";

export function CarbonAttrs(props: RendererProps) {
  const { node } = props;
  const app = useCarbon();

  return (
    <CarbonBlock node={node} className="carbon-attrs">
      <CarbonChildren node={node} />
    </CarbonBlock>
  );
}
