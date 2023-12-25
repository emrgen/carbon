import { useRef } from "react";

import {
  RendererProps
} from "@emrgen/carbon-core";

import {CarbonBlock, CarbonNodeChildren, CarbonNodeContent, useSelectionHalo} from "@emrgen/carbon-react";
import {useDragDropRectSelectHalo} from "@emrgen/carbon-dragon-react";

export const NestableComp = (props: RendererProps) => {
  const { node } = props;
  const ref = useRef(null);
  const {connectors, SelectionHalo} = useDragDropRectSelectHalo({node, ref});

  return (
    <CarbonBlock node={node} ref={ref} custom={connectors}>
      <CarbonNodeContent node={node} />
      <CarbonNodeChildren node={node} />
      {SelectionHalo}
    </CarbonBlock>
  );
};
