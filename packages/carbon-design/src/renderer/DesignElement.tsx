import { CarbonBlock, RendererProps } from "@emrgen/carbon-react";
import { ElementTransformer } from "../components/Resizer";

export const DesignElement = (props: RendererProps) => {
  const { node } = props;
  const { transform } = node.type.spec;

  return (
    <CarbonBlock {...props} custom={{}}>
      <ElementTransformer node={node} />
    </CarbonBlock>
  );
};