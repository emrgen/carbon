import React, {useRef} from "react";
import {CarbonBlock, CarbonNodeContent, RendererProps, useCarbon} from "@emrgen/carbon-react";
import {useDocument} from "../hooks";

export function ButtonComp(props: RendererProps) {
  const {node} = props;
  const app = useCarbon();
  const ref = useRef(null);
  const document = useDocument();

  return (
    <CarbonBlock {...props} ref={ref}>
      <div className={'carbon-button'} contentEditable={true} suppressContentEditableWarning={true}>
        <CarbonNodeContent node={node} />
      </div>
    </CarbonBlock>
  );
}
