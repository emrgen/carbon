import { CarbonBlock, RendererProps } from "@emrgen/carbon-react";

export const Newline = (props: RendererProps) => {
  return (
    <CarbonBlock {...props}>
      <br />
    </CarbonBlock>
  );
};
