import React, { useMemo } from "react";
import {
  CarbonBlock,
  CarbonChildren,
  RendererProps,
} from "@emrgen/carbon-core";

export default function TitleComp(props: RendererProps) {
  const { node } = props;

  // console.log('TitleComp', props);

  const custom = node.isEmpty
    ? {
        ...props.custom,
        placeholder:
          props.custom?.placeholder ?? node.parent?.attrs.node.emptyPlaceholder ?? (node.parent?.attrs.node.showPlaceholder ? node.parent?.attrs.node.focusPlaceholder : '' ) ?? "",
      }
    : {};


  return (
    <CarbonBlock {...props} custom={custom}>
      <CarbonChildren {...props} />
    </CarbonBlock>
  );
}
