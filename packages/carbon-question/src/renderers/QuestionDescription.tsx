import React from "react";
import {CarbonBlock, CarbonChildren, RendererProps} from "@emrgen/carbon-react";

export function QuestionDescriptionComp(props: RendererProps) {
  const {node} = props;

  return (
    <CarbonBlock node={node} custom={{placeholder: 'Description'}}>
      <div className={'description-wrapper'} contentEditable={true} suppressContentEditableWarning={true}>
        <CarbonChildren node={node}/>
      </div>
    </CarbonBlock>
  );
}
