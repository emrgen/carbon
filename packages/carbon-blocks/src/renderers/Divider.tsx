import { useRef, useCallback } from "react";
import {
  CarbonBlock,
  CarbonNodeContent,
  RendererProps,
  useCarbon,
  useSelectionHalo
} from "@emrgen/carbon-core";
import { useCombineConnectors, useConnectorsToProps, useDragDropRectSelect } from "@emrgen/carbon-dragon";

export default function DividerComp(props: RendererProps) {
  const app = useCarbon();
  const {node} = props;
2
  const ref = useRef(null);

  const selection = useSelectionHalo(props);
  const dragDropRect = useDragDropRectSelect({ node, ref });
  const connectors = useConnectorsToProps(
    useCombineConnectors(dragDropRect, selection)
  );

  const handleClick = useCallback(e => {
    e.preventDefault();
    e.stopPropagation();
    if (app.blockSelection && app.blockSelection.has(node.id)) return
    // if (app.blockSelection)
    app.tr.selectNodes([node.id]).dispatch();
  },[app.blockSelection, app.tr, node.id])

  const handleMouseDown = useCallback(e => {
    if (app.blockSelection && app.blockSelection.has(node.id)) {
      e.preventDefault();
      e.stopPropagation();
    }
  },[app.blockSelection, node.id])

  return (
    <CarbonBlock
      node={node}
      custom={{
        onClick: handleClick,
        onMouseDown: handleMouseDown,
        ...connectors,
      }}
      ref={ref}
    >
      <div
        className="divider"
        contentEditable="false"
        suppressContentEditableWarning
      ></div>
      {/* <span /> */}
      <CarbonNodeContent node={node} />
      {selection.SelectionHalo}
    </CarbonBlock>
  );
}
