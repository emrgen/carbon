import { CarbonBlock, RendererProps } from "@emrgen/carbon-react";
import { LinkPath } from "@emrgen/carbon-core";

export const PageLinkComp = (props: RendererProps) => {
  const { node } = props;
  const page = node.props.get(LinkPath, "");
  return (
    <CarbonBlock node={node}>
      <a
        href={page}
        className={"pageLink-wrapper"}
        target={"_blank"}
        rel="noreferrer"
      >
        <div className={"page-link-icon"}>⛳</div>
        <div className={"page-link-text"}>{page}</div>
      </a>
    </CarbonBlock>
  );
};
