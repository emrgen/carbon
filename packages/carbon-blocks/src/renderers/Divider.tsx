import {
  CarbonBlock,
  CarbonNodeContent,
  RendererProps,
  preventAndStop,
  useCarbon,
  useSelectionHalo, PinnedSelection, PointedSelection
} from "@emrgen/carbon-core";
import {
  useCombineConnectors,
  useConnectorsToProps,
  useDragDropRectSelect,
} from "@emrgen/carbon-dragon";
import { useCallback, useRef } from "react";

export default function DividerComp(props: RendererProps) {
  const app = useCarbon();
  const { node } = props;
  2;
  const ref = useRef(null);

  const selection = useSelectionHalo(props);
  const dragDropRect = useDragDropRectSelect({ node, ref });
  const connectors = useConnectorsToProps(
    useCombineConnectors(dragDropRect, selection)
  );

  const handleClick = useCallback(
    (e, app) => {
      preventAndStop(e);
      // avoid selection if block is already selected
      if (app.selection.nodes.some((n) => n.id.eq(node.id))) return;
      app.cmd.select(PointedSelection.fromNodes([node.id]))
    },
    [node.id]
  );

  const handleMouseDown = useCallback(
    (e) => {
      if (app.selection.blocks.some((n) => n.id.eq(node.id))) {
        preventAndStop(e)
      }
    },
    [app.selection, node.id]
  );

  return (
    <CarbonBlock
      node={node}
      custom={{
        onClick: (e) => handleClick(e, app),
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
      {/* <CarbonNodeContent node={node} /> */}
      {selection.SelectionHalo}
    </CarbonBlock>
  );
}
