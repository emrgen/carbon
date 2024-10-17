import { CarbonBlock, RendererProps } from "@emrgen/carbon-react";

export const CellViewComp = (props: RendererProps) => {
  const { node } = props;

  return <CarbonBlock node={node}></CarbonBlock>;
};
