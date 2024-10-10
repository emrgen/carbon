import { useRef } from "react";

import {
  CarbonBlock,
  CarbonNodeContent,
  RendererProps,
} from "@emrgen/carbon-react";
import { CarbonNodeChildren } from "@emrgen/carbon-react";

export const NestableComp = (props: RendererProps) => {
  const { node, custom } = props;
  const ref = useRef(null);
  // const {connectors, SelectionHalo} = useDragDropRectSelectHalo({node, ref});

  return (
    <CarbonBlock node={node} custom={custom}>
      <CarbonNodeContent node={node} />
      <CarbonNodeChildren node={node} />
      {/*{SelectionHalo}*/}
    </CarbonBlock>
  );
};
