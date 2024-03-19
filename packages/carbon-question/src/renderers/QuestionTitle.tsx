import React from "react";
import {CarbonBlock, CarbonChildren, RendererProps} from "@emrgen/carbon-react";

export function QuestionTitleComp(props: RendererProps) {
  const {node} = props;

  return (
    <CarbonBlock node={node} custom={{placeholder: 'Question title'}}>
      <div className={'title-wrapper'} contentEditable={true} suppressContentEditableWarning={true}>
        <CarbonChildren node={node}/>
      </div>
    </CarbonBlock>
  );
}
