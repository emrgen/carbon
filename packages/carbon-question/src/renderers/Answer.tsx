import {
  Carbon,
} from "@emrgen/carbon-core";
import React from "react";
import {CarbonBlock, CarbonNodeChildren, CarbonNodeContent, RendererProps} from "@emrgen/carbon-react";

export function QuestionAnswerComp(props: RendererProps) {
  const { node } = props;

  return (
    <CarbonBlock node={node}>
      <CarbonNodeContent node={node} />
      <CarbonNodeChildren node={node}/>
    </CarbonBlock>
  );
}
