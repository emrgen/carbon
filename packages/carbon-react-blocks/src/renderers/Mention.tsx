import { CarbonBlock, RendererProps } from "@emrgen/carbon-react";
import { CarbonChildren } from "@emrgen/carbon-react";

export const MentionComp = (props: RendererProps) => {
  const { node } = props;

  return (
    <CarbonBlock node={node}>
      {/*<span data-name={"text"}>{node.props.get(AtomContentPath) ?? ""}</span>*/}
      {/*{!!node.children.length && <CarbonChildren node={node} />}*/}
      <CarbonChildren node={node} />
    </CarbonBlock>
  );
};
