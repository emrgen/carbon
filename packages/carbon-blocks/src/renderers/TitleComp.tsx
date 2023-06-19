import React, { useMemo } from "react";
import {
  CarbonBlock,
  CarbonChildren,
  RendererProps,
} from "@emrgen/carbon-core";

export default function TitleComp(props: RendererProps) {
  const { node, version } = props;

  const custom = node.isEmpty
    ? {
      ...props.custom,
        placeholder:
          props.custom?.placeholder ?? node.parent?.attrs.html.placeholder ?? "",
      }
    : {};

  return (
    <CarbonBlock {...props} custom={custom}>
      <CarbonChildren {...props} />
    </CarbonBlock>
  );
}
