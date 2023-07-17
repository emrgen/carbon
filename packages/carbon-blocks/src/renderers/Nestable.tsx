import {
  CarbonBlock,
  CarbonNodeChildren,
  CarbonNodeContent,
  RendererProps,
  useSelectionHalo,
} from "@emrgen/carbon-core";
import {
  useCombineConnectors,
  useConnectorsToProps,
  useDragDropRectSelect,
} from "@emrgen/carbon-dragon";
import { useRef } from "react";

export const NestableComp = (props: RendererProps) => {
  const { node, placeholder } = props;

  const ref = useRef(null);

  const selection = useSelectionHalo(props);
  const dragDropRect = useDragDropRectSelect({ node, ref });
  const connectors = useConnectorsToProps(
    useCombineConnectors(dragDropRect, selection)
  );

  return (
    <CarbonBlock node={node} ref={ref} custom={connectors}>
      <CarbonNodeContent
        node={node}
        placeholder={
          placeholder ?? (node.isEmpty ? node.attrs.node.emptyPlaceholder : '')
        }
      />
      <CarbonNodeChildren node={node} />
      {selection.SelectionHalo}
    </CarbonBlock>
  );
};
