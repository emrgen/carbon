import {
  CarbonBlock,
  CarbonNodeChildren,
  CarbonNodeContent,
  RendererProps,
  useSelectionHalo,
} from "@emrgen/carbon-react";

export const NestableComp = (props: RendererProps) => {
  const { node, custom } = props;
  const { SelectionHalo } = useSelectionHalo(props);

  return (
    <CarbonBlock {...props}>
      <CarbonNodeContent node={node} />
      <CarbonNodeChildren node={node} />
      {SelectionHalo}
    </CarbonBlock>
  );
};
