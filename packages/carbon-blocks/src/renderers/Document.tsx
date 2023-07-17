import { useRef } from "react";

import {
  CarbonBlock,
  CarbonNodeChildren,
  CarbonNodeContent,
  RendererProps
} from "@emrgen/carbon-core";
import { useCombineConnectors, useConnectorsToProps, useDndRegion, useRectSelectionSurface } from "@emrgen/carbon-dragon";

export const DocumentComp = (props: RendererProps) => {
  const { node } = props;

  const ref = useRef<HTMLElement>(null);
  const dndRegion = useDndRegion({ node, ref });
  const selectionSurface = useRectSelectionSurface({ node, ref });
  const connectors = useConnectorsToProps(
    useCombineConnectors(selectionSurface, dndRegion)
  );

  return (
    <CarbonBlock node={node} ref={ref} custom={connectors}>
      <CarbonNodeContent node={node} custom={{ placeholder: "Untitled" }} />
      <CarbonNodeChildren node={node} />
    </CarbonBlock>
  );
};
