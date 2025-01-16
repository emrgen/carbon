import { useRectSelectable } from "@emrgen/carbon-dragon-react";
import {
  CarbonBlock,
  CarbonNodeChildren,
  CarbonNodeContent,
  RendererProps,
  useSelectionHalo,
} from "@emrgen/carbon-react";
import { useRef } from "react";

export const CalloutComp = (props: RendererProps) => {
  const { node, custom } = props;
  const ref = useRef(null);
  useRectSelectable({ node, ref });
  const { SelectionHalo } = useSelectionHalo(props);

  return (
    <CarbonBlock node={node} custom={custom} ref={ref}>
      <CarbonNodeContent node={node} custom={{ className: "ccout__ti" }} />
      <CarbonNodeChildren node={node} className={"ccout__cnest"} wrap={true} />
      {SelectionHalo}
    </CarbonBlock>
  );
};
