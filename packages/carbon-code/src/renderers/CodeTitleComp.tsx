import {
  CarbonBlock,
  CarbonChildren,
  RendererProps,
} from "@emrgen/carbon-react";

export const CodeTitleComp = (props: RendererProps) => {
  const { node } = props;
  const handleMouseDown = () => {
    console.log("xxxxxxxxxxxxxxx");
    // node.updateNode({ isEmpty: false });
  };
  return (
    <CarbonBlock node={node}>
      <CarbonChildren node={node} />
      {/*this is a hack to show a new line when a \n is present in the title*/}
      {!node.isEmpty && <span onClick={handleMouseDown}>{`\n`}</span>}
    </CarbonBlock>
  );
};
