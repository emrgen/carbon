import React, { useRef } from "react";
import {
  CarbonBlock,
  CarbonNodeContent,
  RendererProps,
} from "@emrgen/carbon-react";

export function ButtonComp(props: RendererProps) {
  const { node } = props;
  const ref = useRef(null);

  return (
    <CarbonBlock {...props} ref={ref}>
      <div
        className={"carbon-button"}
        contentEditable={true}
        suppressContentEditableWarning={true}
      >
        <CarbonNodeContent node={node} />
      </div>
    </CarbonBlock>
  );
}
