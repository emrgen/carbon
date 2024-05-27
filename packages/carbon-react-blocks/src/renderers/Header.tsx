import { useRef } from "react";

import {
  CarbonBlock,
  CarbonNodeChildren,
  CarbonNodeContent,
  RendererProps,
} from "@emrgen/carbon-react";
import { useDragDropRectSelectHalo } from "@emrgen/carbon-dragon-react";

export const HeaderComp = (props: RendererProps) => {
  const { node } = props;
  const ref = useRef(null);
  const { connectors, SelectionHalo } = useDragDropRectSelectHalo({
    node,
    ref,
  });

  return (
    <CarbonBlock
      node={node}
      ref={ref}
      custom={{ ...connectors, id: node.id.toString() }}
    >
      <CarbonNodeContent node={node} />
      <CarbonNodeChildren node={node} />
      {SelectionHalo}
    </CarbonBlock>
  );
};
