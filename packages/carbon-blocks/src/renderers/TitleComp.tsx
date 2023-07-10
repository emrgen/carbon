import React, { useCallback, useMemo } from "react";
import {
  CarbonBlock,
  CarbonChildren,
  RendererProps,
} from "@emrgen/carbon-core";

export default function TitleComp(props: RendererProps) {
  const { node } = props;

  // console.log('TitleComp', props);

  const onMouseDown = useCallback((e) => {
    // e.preventDefault();
  },[])

  const custom = node.isEmpty
    ? {
        onMouseDown,
        ...props.custom,
        placeholder:
          props.custom?.placeholder ??
          node.parent?.attrs.node.placeholder ?? "",
      }
    : { onMouseDown };


  return (
    <CarbonBlock {...props} custom={custom}>
      <CarbonChildren {...props} />
    </CarbonBlock>
  );
}
