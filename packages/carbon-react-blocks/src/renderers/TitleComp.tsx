import React, { useCallback, useMemo } from "react";
import {
  InlineContent,
  RendererProps,
  Node,
  BlockContent,
} from "@emrgen/carbon-core";
import {CarbonBlock, CarbonChildren} from "@emrgen/carbon-react";

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
