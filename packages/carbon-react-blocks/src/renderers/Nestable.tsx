import { useDragDropRectSelectHalo } from "@emrgen/carbon-dragon-react";
import {
  CarbonBlock,
  CarbonNodeChildren,
  CarbonNodeContent,
  RendererProps,
} from "@emrgen/carbon-react";
import { useRef } from "react";

export const NestableComp = (props: RendererProps) => {
  const { node, custom } = props;
  const ref = useRef(null);
  const { connectors, SelectionHalo } = useDragDropRectSelectHalo({
    node,
    ref,
  });

  return (
    <CarbonBlock node={node} custom={custom}>
      <CarbonNodeContent node={node} />
      <CarbonNodeChildren node={node} />
      {/*{SelectionHalo}*/}
    </CarbonBlock>
  );
};
