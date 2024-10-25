import {
  CarbonBlock,
  CarbonChildren,
  RendererProps,
} from "@emrgen/carbon-react";

export const FlashAnswerComp = (props: RendererProps) => {
  return (
    <CarbonBlock {...props}>
      <div
        className={"flash-card-answer-content"}
        contentEditable={true}
        suppressContentEditableWarning={true}
      >
        <CarbonChildren node={props.node} />
      </div>
    </CarbonBlock>
  );
};