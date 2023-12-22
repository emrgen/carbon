import {
  CarbonBlock, CarbonEmpty,
  CarbonNodeChildren,
  CarbonNodeContent, CarbonPlaceholder,
  RendererProps, useSelectionHalo
} from "@emrgen/carbon-core";
import {useRef} from "react";
import {useCombineConnectors, useConnectorsToProps, useDragDropRectSelect} from "@emrgen/carbon-dragon";

export const CommentEditorComp = (props: RendererProps) => {
  const {node} = props;
  const ref = useRef(null);

  const selection = useSelectionHalo(props);
  const dragDropRect = useDragDropRectSelect({ node, ref });
  const connectors = useConnectorsToProps(
    useCombineConnectors(dragDropRect, selection)
  );


  return (
    <CarbonBlock {...props} ref={ref} custom={connectors}>
      <CarbonPlaceholder node={node}/>
      <CarbonNodeContent node={node} />
      <CarbonNodeChildren node={node} />
      {selection.SelectionHalo}
    </CarbonBlock>
  );
}
