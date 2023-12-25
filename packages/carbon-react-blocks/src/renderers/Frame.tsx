import {
  RendererProps
} from "@emrgen/carbon-core";
import { useRef } from "react";
import {CarbonBlock, CarbonNodeChildren, CarbonNodeContent, useSelectionHalo} from "@emrgen/carbon-react";
import {useDragDropRectSelectHalo} from "@emrgen/carbon-dragon-react";

export default function FrameComp(props: RendererProps) {
  const { node } = props;
  const ref = useRef(null);
  const {connectors, SelectionHalo} = useDragDropRectSelectHalo({node, ref})

  return (
    <CarbonBlock node={node} ref={ref} custom={connectors}>
      <CarbonNodeContent node={node}/>
      <CarbonNodeChildren node={node} />
      {SelectionHalo}
    </CarbonBlock>
  );
}
