import { CarbonBlock, CarbonChildren } from "@emrgen/carbon-react";
import { RendererProps } from "@emrgen/carbon-react";

export const HintsComp = (props: RendererProps) => {
  const { node } = props;

  return (
    <CarbonBlock node={node}>
      <div contentEditable={true} suppressContentEditableWarning={true}>
        <CarbonChildren node={node} />
      </div>
    </CarbonBlock>
  );
};
