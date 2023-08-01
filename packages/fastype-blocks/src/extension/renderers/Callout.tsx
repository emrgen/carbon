import { NestableComp, usePlaceholder } from "@emrgen/carbon-blocks";
import { useRef } from "react";

import {
  CarbonBlock,
  CarbonNodeChildren,
  CarbonNodeContent,
  RendererProps,
  useSelectionHalo,
} from "@emrgen/carbon-core";
import {
  useCombineConnectors,
  useConnectorsToProps,
  useDragDropRectSelect,
} from "@emrgen/carbon-dragon";

export const CalloutComp = NestableComp;

export const Callout = (props: RendererProps) => {
  const { node } = props;

  const ref = useRef(null);

  const selection = useSelectionHalo(props);
  const dragDropRect = useDragDropRectSelect({ node, ref });
  const connectors = useConnectorsToProps(
    useCombineConnectors(dragDropRect, selection)
  );

  const placeholder = usePlaceholder(node);

  return (
    <CarbonBlock node={node} ref={ref} custom={connectors}>
      <CarbonNodeContent node={node} custom={placeholder} />
      <CarbonNodeChildren node={node} />
      {selection.SelectionHalo}
    </CarbonBlock>
  );
};
