import { CarbonBlock, CarbonChildren, EmptySpan, RendererProps } from "@emrgen/carbon-react";
import React from "react";

export default function TitleComp(props: RendererProps) {
  const { node, custom } = props;
  const { textContent } = node;

  return (
    <CarbonBlock {...props} custom={{ custom, "data-empty": node.isEmpty }}>
      <CarbonChildren {...props} />
      {/* need to remove from dom before selection */}
      {/* <div className="carbon-ai-suggested">
        <CarbonChildren node={cloned} />
      </div> */}

      {!!textContent?.endsWith("\n") && <EmptySpan />}
    </CarbonBlock>
  );
}
