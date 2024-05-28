import {
  CarbonBlock,
  CarbonChildren,
  RendererProps,
} from "@emrgen/carbon-react";

export const CodeTitleComp = (props: RendererProps) => {
  const { node } = props;
  return (
    <CarbonBlock node={node}>
      <CarbonChildren node={node} />
      {/*this is a hack to show a new line when a \n is present in the title*/}
      {!node.isEmpty && <span>{`\n`}</span>}
    </CarbonBlock>
  );
};
