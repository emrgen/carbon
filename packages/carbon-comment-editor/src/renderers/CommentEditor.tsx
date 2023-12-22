import {
  CarbonBlock, CarbonEmpty,
  CarbonNodeChildren,
  CarbonNodeContent, CarbonPlaceholder,
  RendererProps, useCarbon, useSelectionHalo
} from "@emrgen/carbon-core";
import {useCallback, useRef} from "react";
import {useCombineConnectors, useConnectorsToProps, useDragDropRectSelect} from "@emrgen/carbon-dragon";

export const CommentEditorComp = (props: RendererProps) => {
  const {node} = props;
  const ref = useRef(null);
  const app = useCarbon();

  const selection = useSelectionHalo(props);
  const dragDropRect = useDragDropRectSelect({node, ref});
  const connectors = useConnectorsToProps(
    useCombineConnectors(dragDropRect, selection)
  );

  const handleInsertNode = useCallback((e) => {
    app.cmd.inserter.append(node, 'section').dispatch();
  }, [app])


  return (
    <CarbonBlock
      {...props} ref={ref}
      custom={{
        connectors,
        contentEditable: !node.isVoid,
        suppressContentEditableWarning: true
      }}
    >
      <CarbonPlaceholder node={node} onClick={handleInsertNode}/>
      <CarbonNodeContent node={node}/>
      <CarbonNodeChildren node={node}/>
      {selection.SelectionHalo}
    </CarbonBlock>
  );
}
