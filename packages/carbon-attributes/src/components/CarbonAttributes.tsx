import React from "react";
import {
  CarbonBlock,
  CarbonChildren,
  RendererProps,
  useCarbon,
} from "@emrgen/carbon-react";
import { stop } from "@emrgen/carbon-core";

export function CarbonAttrs(props: RendererProps) {
  const { node } = props;
  const app = useCarbon();

  return (
    <CarbonBlock
      node={node}
      className="carbon-attrs"
      custom={{
        onBeforeInput: stop,
        onInput: stop,
        onKeyDown: stop,
        onMouseMove: stop,
        onMouseDown: stop,
        onMouseUp: stop,
        onClick: stop,
        onMouseOver: stop,
        onMouseOut: stop,
      }}
    >
      <CarbonChildren node={node} />
    </CarbonBlock>
  );
}
