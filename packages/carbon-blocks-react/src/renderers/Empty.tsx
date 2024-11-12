import { RendererProps } from "@emrgen/carbon-react";

export const EmptyInline = (props: RendererProps) => {
  return <span className={"empty-zero-width-space"}></span>;
};
