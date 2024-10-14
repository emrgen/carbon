import { useRef } from "react";

import {
  CarbonBlock,
  CarbonNodeChildren,
  CarbonNodeContent,
  RendererProps,
} from "@emrgen/carbon-react";
import { CarbonNode } from "@emrgen/carbon-react";
import { useDragDropRectSelectHalo } from "@emrgen/carbon-dragon-react";

export const HeaderComp = (props: RendererProps) => {
  const { node, custom } = props;
  const ref = useRef(null);
  const { connectors, SelectionHalo } = useDragDropRectSelectHalo({
    node,
    ref,
  });

  return (
    <CarbonBlock node={node} ref={ref} custom={{ ...connectors, ...custom }}>
      {node.size === 1 ? (
        <CarbonNode node={node.child(0)!} />
      ) : (
        <CarbonNodeContent node={node} />
      )}
      <CarbonNodeChildren node={node} />
      {SelectionHalo}
    </CarbonBlock>
  );
};
