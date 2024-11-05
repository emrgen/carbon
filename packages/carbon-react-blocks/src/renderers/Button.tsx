import {
  CarbonBlock,
  CarbonNodeContent,
  RendererProps,
} from "@emrgen/carbon-react";
import React, { useMemo, useRef } from "react";
import { useDocument } from "../hooks/index";

export function ButtonComp(props: RendererProps) {
  const { node } = props;
  const ref = useRef(null);
  const { isEditable } = useDocument();

  const button = useMemo(() => {
    return (
      <div
        className={"carbon-button"}
        contentEditable={isEditable}
        suppressContentEditableWarning={true}
      >
        <CarbonNodeContent node={node} />
      </div>
    );
  }, [isEditable, node]);

  return (
    <CarbonBlock {...props} ref={ref}>
      {button}
    </CarbonBlock>
  );
}
