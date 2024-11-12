import {
  CarbonBlock,
  CarbonNodeChildren,
  CarbonNodeContent,
  RendererProps,
  useSelectionHalo,
} from "@emrgen/carbon-react";
import { BlockOptions } from "../components/BlockOptions/mod";

export const NestableComp = (props: RendererProps) => {
  const { node } = props;
  const { SelectionHalo } = useSelectionHalo(props);

  return (
    <CarbonBlock {...props}>
      <CarbonNodeContent node={node} />
      <CarbonNodeChildren node={node} />
      {SelectionHalo}
      <BlockOptions node={node} />
    </CarbonBlock>
  );
};
