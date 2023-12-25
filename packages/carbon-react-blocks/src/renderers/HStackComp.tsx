import React from 'react'
import { useRef } from 'react';
import {CarbonBlock, CarbonChildren, RendererProps, useSelectionHalo} from "@emrgen/carbon-react";
import {useCombineConnectors, useConnectorsToProps, useDragDropRectSelect} from "@emrgen/carbon-dragon-react";

export function HStackComp(props: RendererProps) {
  const {node} = props;

  const ref = useRef(null);

  const selection = useSelectionHalo(props);
  const dragDropRect = useDragDropRectSelect({ node, ref });
  const connectors = useConnectorsToProps(
    useCombineConnectors(dragDropRect, selection)
  );

  return (
    <CarbonBlock {...props} ref={ref} custom={connectors}>
      <CarbonChildren node={node} />
      {selection.SelectionHalo}
    </CarbonBlock>
  );
}
