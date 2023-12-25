import {CarbonBlock, RendererProps, useCarbon, useSelectionHalo} from "@emrgen/carbon-react";
import {useCallback, useRef} from "react";
import {PointedSelection, preventAndStop} from "@emrgen/carbon-core";
import {useDragDropRectSelectHalo} from "@emrgen/carbon-dragon-react";

export default function DividerComp(props: RendererProps) {
  const app = useCarbon();
  const { node } = props;

  const ref = useRef(null);
  const {connectors, SelectionHalo} = useDragDropRectSelectHalo({node, ref})

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
      {SelectionHalo}
    </CarbonBlock>
  );
}
