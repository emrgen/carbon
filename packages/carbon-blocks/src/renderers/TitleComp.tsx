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
  const { node } = props;
  const app = useCarbon();

  const onMouseDown = useCallback((e) => {
    // e.preventDefault();
  },[])

  const { parent } = node;

  const custom = node.isEmpty
    ? {
        onMouseDown,
        ...props.custom,
        placeholder:
          props.custom?.placeholder ??
          node.parent?.attrs.node.placeholder ?? "",
      }
    : { onMouseDown, ...props.custom };

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
