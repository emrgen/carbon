import { CarbonBlock, CarbonChildren } from "@emrgen/carbon-react";
import { RendererProps } from "@emrgen/carbon-react";

export const ExplanationsComp = (props: RendererProps) => {
  return (
    <CarbonBlock node={props.node}>
      <div contentEditable={true} suppressContentEditableWarning={true}>
        <CarbonChildren node={props.node} />
      </div>
    </CarbonBlock>
  );
};
