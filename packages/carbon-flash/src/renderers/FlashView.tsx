import {
  CarbonBlock,
  CarbonChildren,
  RendererProps,
} from "@emrgen/carbon-react";

export const FlashViewComp = (props: RendererProps) => {
  return (
    <CarbonBlock {...props}>
      <div
        className={"flash-card-view-content"}
        contentEditable={true}
        suppressContentEditableWarning={true}
      >
        <CarbonChildren node={props.node} />
      </div>
    </CarbonBlock>
  );
};