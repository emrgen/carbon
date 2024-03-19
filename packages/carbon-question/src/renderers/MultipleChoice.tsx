import {CarbonBlock, CarbonChildren, RendererProps} from "@emrgen/carbon-react";

export const MultipleChoiceComp = (props: RendererProps) => {
  return (
    <CarbonBlock node={props.node}>
      <div contentEditable={true} suppressContentEditableWarning={true}>
        <CarbonChildren node={props.node} />
      </div>
    </CarbonBlock>
  );
}


export const MultipleChoiceOptionComp = (props: RendererProps) => {
  const {node} = props;

  const index = node.index + 1;

  return (
    <CarbonBlock node={props.node}>
      <div className={'multiple-choice-option'}>
        <div className={'multiple-choice-option__input'} contentEditable={false} key={node.key}>{index}</div>
        <CarbonChildren node={props.node} />
      </div>
    </CarbonBlock>
  );
}
