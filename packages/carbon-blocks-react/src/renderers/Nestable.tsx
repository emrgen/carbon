import { useDragDropRectSelect } from "@emrgen/carbon-dragon-react";
import {
  CarbonBlock,
  CarbonNodeChildren,
  CarbonNodeContent,
  RendererProps,
  useSelectionHalo,
} from "@emrgen/carbon-react";
import { useRef } from "react";
import { BlockOptions } from "../components/BlockOptions/mod";

export const NestableComp = (props: RendererProps) => {
  const { node } = props;
  const ref = useRef(null);
  useDragDropRectSelect({ node, ref });
  const { SelectionHalo } = useSelectionHalo(props);

  return (
    <CarbonBlock {...props} ref={ref}>
      <CarbonNodeContent node={node} />
      <CarbonNodeChildren node={node} />
      {SelectionHalo}
      <BlockOptions node={node} />
    </CarbonBlock>
  );
};
