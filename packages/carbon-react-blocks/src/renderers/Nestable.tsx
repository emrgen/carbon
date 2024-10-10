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
      <CarbonNodeContent node={node} custom={{ className: "cse__ti" }} />
      <CarbonNodeChildren
        node={node}
        className={"cnest"}
        wrap={true}
        // custom={{ className: "cse__ch" }}
      />
      {/*{SelectionHalo}*/}
    </CarbonBlock>
  );
};
