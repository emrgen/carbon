import { preventAndStop } from "@emrgen/carbon-core";
import {
  useCombineConnectors,
  useConnectorsToProps,
  useDragDropRectSelect,
} from "@emrgen/carbon-dragon-react";
import {
  CarbonBlock,
  RendererProps,
  useCarbon,
  useSelectionHalo,
} from "@emrgen/carbon-react";

import { useCallback, useRef } from "react";

export function SeparatorComp(props: RendererProps) {
  const app = useCarbon();
  const { node } = props;
  const ref = useRef(null);

  const selection = useSelectionHalo(props);
  const dragDropRect = useDragDropRectSelect({ node, ref });
  const connectors = useConnectorsToProps(
    useCombineConnectors(dragDropRect, selection),
  );

  const handleClick = useCallback(
    (e) => {
      preventAndStop(e);
      // avoid selection if block is already selected
      if (app.selection.blocks.some((n) => n.id.eq(node.id))) return;
      // react.tr.selectNodes([node.id]).Dispatch();
    },
    [app, node.id],
  );

  const handleMouseDown = useCallback(
    (e) => {
      if (app.selection.blocks.some((n) => n.id.eq(node.id))) {
        preventAndStop(e);
      }
    },
    [app.selection.blocks, node.id],
  );

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
        className="fastype-separator"
        contentEditable="false"
        suppressContentEditableWarning
      >
        ***
      </div>
      {selection.SelectionHalo}
    </CarbonBlock>
  );
}
