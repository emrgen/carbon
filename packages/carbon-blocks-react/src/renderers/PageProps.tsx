import { CarbonBlock, RendererProps } from "@emrgen/carbon-react";

export const PageProps = (props: RendererProps) => {
  const { node } = props;
  return <CarbonBlock node={node}>123</CarbonBlock>;
};