import {
  CarbonBlock,
  CarbonChildren,
  EmptySpan,
  RendererProps,
} from "@emrgen/carbon-react";
import React from "react";

export default function TitleComp(props: RendererProps) {
  const { node, custom } = props;
  const { textContent } = node;

  console.log("TitleComp", node.size);

  return (
    <CarbonBlock {...props} custom={custom}>
      <CarbonChildren {...props} />
      {/* need to remove from dom before selection */}
      {/* <div className="carbon-ai-suggested">
        <CarbonChildren node={cloned} />
      </div> */}

      {!!textContent?.endsWith("\n") && <EmptySpan />}
    </CarbonBlock>
  );
}
