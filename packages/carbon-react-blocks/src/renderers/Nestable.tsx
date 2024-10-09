import { useRef } from "react";

import {
  CarbonBlock,
  CarbonNodeContent,
  RendererProps,
} from "@emrgen/carbon-react";
import { CarbonNode } from "@emrgen/carbon-react";
import { CarbonNodeChildren } from "@emrgen/carbon-react";

export const NestableComp = (props: RendererProps) => {
  const { node } = props;
  const ref = useRef(null);
  // const {connectors, SelectionHalo} = useDragDropRectSelectHalo({node, ref});

  if (node.size === 1) {
    return <CarbonNode node={node.child(0)!} />;
  }

  return (
    <CarbonBlock node={node}>
      <CarbonNodeContent node={node} />
      <CarbonNodeChildren node={node} />
      {/*{SelectionHalo}*/}
    </CarbonBlock>
  );
};
