import React, { useRef } from "react";

import {
  CarbonBlock,
  CarbonChildren,
  CarbonNodeChildren,
  CarbonNodeContent,
  RendererProps,
} from "@emrgen/carbon-core";
import CarbonLink from "./CarbonLink";

export const DocumentComp = (props: RendererProps) => {
  const { node } = props;

  const ref = useRef(null);
  // const dndRegion = useDndRegion({ node, ref });
  // const selectionSurface = useRectSelectionSurface({ node, ref });
  // const connectors = useConnectorsToProps(useCombineConnectors(
  // 	selectionSurface,
  // 	dndRegion
  // ));


  // console.log(connectors)
  return (
    <CarbonBlock node={node} ref={ref}>
      <CarbonNodeContent node={node} custom={{placeholder: 'Untitled'}}/>
      <CarbonNodeChildren node={node} />
    </CarbonBlock>
  );
};
