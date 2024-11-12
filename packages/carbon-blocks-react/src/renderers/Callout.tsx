import { RendererProps } from "@emrgen/carbon-react";
import { CarbonNodeContent } from "@emrgen/carbon-react";
import { CarbonBlock } from "@emrgen/carbon-react";
import { CarbonNodeChildren } from "@emrgen/carbon-react";
import { useRef } from "react";

export const CalloutComp = (props: RendererProps) => {
  const { node, custom } = props;
  const ref = useRef(null);
  // const {connectors, SelectionHalo} = useDragDropRectSelectHalo({node, ref});

  return (
    <CarbonBlock node={node} custom={custom}>
      <CarbonNodeContent node={node} custom={{ className: "ccout__ti" }} />
      <CarbonNodeChildren node={node} className={"ccout__cnest"} wrap={true} />
      {/*{SelectionHalo}*/}
    </CarbonBlock>
  );
};
