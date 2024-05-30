import { CarbonText, RendererProps } from "@emrgen/carbon-react";

export const MentionComp = (props: RendererProps) => {
  const { node, children } = props;

  return (
    <>
      {/*<span>&shy;</span>*/}
      <CarbonText node={node} />
      {/*<span>&shy;</span>*/}
    </>
  );
};
