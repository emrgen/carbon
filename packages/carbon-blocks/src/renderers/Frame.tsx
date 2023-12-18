import {
  CarbonBlock,
  CarbonNodeChildren,
  CarbonNodeContent,
  RendererProps,
  useSelectionHalo
} from "@emrgen/carbon-core";
import { useCombineConnectors, useConnectorsToProps, useDragDropRectSelect } from "@emrgen/carbon-dragon";
import { useRef } from "react";

export default function FrameComp(props: RendererProps) {
  const { node } = props;
  const ref = useRef(null);

  const selection = useSelectionHalo(props);
  const dragDropRect = useDragDropRectSelect({ node, ref });
  const connectors = useConnectorsToProps(
    useCombineConnectors(dragDropRect, selection)
  );


  return (
    <CarbonBlock node={node} ref={ref} custom={connectors}>
      <CarbonNodeContent node={node}/>
      <CarbonNodeChildren node={node} />
      {selection.SelectionHalo}
    </CarbonBlock>
  );
}
