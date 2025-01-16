import { useDragDropRectSelect } from "@emrgen/carbon-dragon-react";

import {
  CarbonBlock,
  CarbonNodeChildren,
  CarbonNodeContent,
  RendererProps,
  useSelectionHalo,
} from "@emrgen/carbon-react";
import { useRef } from "react";

export const QuoteComp = (props: RendererProps) => {
  const { node } = props;
  const ref = useRef(null);

  useDragDropRectSelect({ node, ref });
  const { SelectionHalo } = useSelectionHalo(props);

  return (
    <CarbonBlock node={node} ref={ref}>
      <CarbonNodeContent node={node} />
      <CarbonNodeChildren node={node} />
      {SelectionHalo}
    </CarbonBlock>
  );
};
