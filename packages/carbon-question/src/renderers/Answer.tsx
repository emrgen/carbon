import { usePlaceholder } from "@emrgen/carbon-blocks";
import {
  Carbon,
  CarbonBlock,
  CarbonNodeChildren,
  CarbonNodeContent,
  RendererProps,
} from "@emrgen/carbon-core";
import React from "react";

export function QuestionAnswerComp(props: RendererProps) {
  const { node } = props;
  const placeholder = usePlaceholder(node);
  
  return (
    <CarbonBlock node={node}>
      <CarbonNodeContent node={node} custom={placeholder}/>
      <CarbonNodeChildren node={node}/>
    </CarbonBlock>
  );
}
