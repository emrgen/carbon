import { preventAndStop } from "@emrgen/carbon-core";
import {
  CarbonBlock,
  RendererProps,
  useCarbon,
  useSelectionHalo,
} from "@emrgen/carbon-react";
import { useCallback, useRef } from "react";

export default function DividerComp(props: RendererProps) {
  const app = useCarbon();
  const { node } = props;

  const ref = useRef(null);
  const { SelectionHalo } = useSelectionHalo(props);

  const handleClick = useCallback(
    (e, app) => {
      preventAndStop(e);
      // avoid selection if block is already selected
      if (app.selection.nodes.some((n) => n.id.eq(node.id))) return;
      app.cmd.SelectBlocks([node.id]).Dispatch();
      // app.cmd.select(PointedSelection.fromNodes([node.id])).dispatch();
    },
    [node.id],
  );

  const handleMouseDown = useCallback(
    (e) => {
      if (app.selection.blocks.some((n) => n.id.eq(node.id))) {
        preventAndStop(e);
      }
    },
    [app.selection, node.id],
  );

  return (
    <CarbonBlock
      node={node}
      custom={{
        onClick: (e) => handleClick(e, app),
        onMouseDown: handleMouseDown,
      }}
      ref={ref}
    >
      <div
        className="cdiv__line"
        contentEditable="false"
        suppressContentEditableWarning
      ></div>
      {/* <span /> */}
      {/* <CarbonNodeContent node={node} /> */}
      {SelectionHalo}
    </CarbonBlock>
  );
}
