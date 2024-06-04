import {
  CarbonBlock,
  CarbonChildren,
  RendererProps,
} from "@emrgen/carbon-react";

export const TableHeader = (props: RendererProps) => {
  const { node } = props;

  return (
    <div className={"table-view-header"}>
      <CarbonBlock node={node}>
        <CarbonChildren node={node} />
      </CarbonBlock>
    </div>
  );
};
