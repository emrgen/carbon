import {
  CarbonBlock,
  CarbonChildren,
  RendererProps,
} from "@emrgen/carbon-react";
import { useMemo } from "react";
import { TableColumnsLink } from "@emrgen/carbon-database";
import { TableHeader } from "./TableHeader";
import { Node } from "@emrgen/carbon-core";

export const TableView = (props: RendererProps) => {
  const { node } = props;

  const header = useMemo(() => {
    return node.links[TableColumnsLink] ?? Node.NULL;
  }, [node]);

  return (
    <CarbonBlock node={node}>
      <TableHeader node={header} />
      <CarbonChildren node={node} />
    </CarbonBlock>
  );
};
