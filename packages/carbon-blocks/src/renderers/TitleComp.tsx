import React from "react";
import {
  CarbonBlock,
  CarbonChildren,
  RendererProps,
} from "@emrgen/carbon-core";

export default function TitleComp(props: RendererProps) {
  return (
    <CarbonBlock {...props}>
      <CarbonChildren {...props} />
    </CarbonBlock>
  );
}
