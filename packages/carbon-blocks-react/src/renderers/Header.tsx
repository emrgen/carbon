import { useRectSelectable } from "@emrgen/carbon-dragon-react";
import {
  CarbonBlock,
  CarbonNode,
  CarbonNodeChildren,
  CarbonNodeContent,
  RendererProps,
  useSelectionHalo,
} from "@emrgen/carbon-react";
import { useRef } from "react";

export const HeaderComp = (props: RendererProps) => {
  const { node, custom } = props;
  const ref = useRef(null);
  useRectSelectable({ node, ref });
  const { SelectionHalo } = useSelectionHalo(props);

  return (
    <CarbonBlock node={node} ref={ref} custom={custom}>
      {node.size === 1 ? (
        <CarbonNode node={node.child(0)!} />
      ) : (
        <CarbonNodeContent node={node} />
      )}
      <CarbonNodeChildren node={node} />
      {SelectionHalo}
    </CarbonBlock>
  );
};
