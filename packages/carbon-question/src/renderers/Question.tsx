import {CarbonBlock, CarbonChildren, RendererProps} from "@emrgen/carbon-react";

export const QuestionComp = (props: RendererProps) => {
  return (
    <CarbonBlock {...props} >
      <CarbonChildren node={props.node} />
      <div className={'question__footer'} contentEditable={false}>
        <div className={'question__footer-add-hint'}>Add Hint</div>
        <div className={'question__footer-add-explanation'}>Add Explanation</div>
      </div>
    </CarbonBlock>
  )
}
