import {
  CarbonBlock,
  CarbonChildren,
  RendererProps,
} from "@emrgen/carbon-react";
import React from "react";

export const CodeContentComp = (props: RendererProps) => {
  const { node } = props;

  return (
    <CarbonBlock node={node} custom={{ tag: "pre" }}>
      <code>
        <CarbonChildren node={node} />
      </code>
    </CarbonBlock>
  );
};
