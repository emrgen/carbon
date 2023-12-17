import React, { useCallback, useMemo } from "react";
import {
  CarbonBlock,
  CarbonChildren,
  InlineContent,
  RendererProps,
  useCarbon,
  Node,
  BlockContent,
} from "@emrgen/carbon-core";

export default function TitleComp(props: RendererProps) {
  const { node, custom } = props;
  return (
    <CarbonBlock {...props} custom={custom}>
      <CarbonChildren {...props} />
      {/* need to remove from dom before selection */}
      {/* <div className="carbon-ai-suggested">
        <CarbonChildren node={cloned} />
      </div> */}
    </CarbonBlock>
  );
}
