import {useCallback, useRef} from "react";
import {
  CarbonBlock,
  CarbonNodeChildren,
  CarbonNodeContent,
  CarbonPlaceholder,
  RendererProps,
  useCarbon,
  useSelectionHalo
} from "@emrgen/carbon-react";
import {useCombineConnectors, useConnectorsToProps, useDragDropRectSelect} from "@emrgen/carbon-dragon-react";
import {prevent, preventAndStop} from "@emrgen/carbon-core";

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
    prevent(e);
    const {lastChild} = node;
    if (lastChild && lastChild.name === 'section' && lastChild.isEmpty) {
      app.cmd.selection.collapseAtStartOf(lastChild).dispatch();
      return
    }

    app.cmd.inserter.append(node, 'section').dispatch();
  }, [app, node])

  return (
    <CarbonBlock {...props} ref={ref} custom={{...connectors}}>
      <CarbonNodeContent node={node}/>
      <CarbonNodeChildren node={node}/>
      {selection.SelectionHalo}
    </CarbonBlock>
  );
}
