import {
  CarbonBlock,
  CarbonNodeContent,
  RendererProps,
  preventAndStop,
  useCarbon,
  useSelectionHalo,
} from "@emrgen/carbon-core";
import {
  useCombineConnectors,
  useConnectorsToProps,
  useDragDropRectSelect,
} from "@emrgen/carbon-dragon";
import { useCallback, useRef } from "react";

export function SeparatorComp(props: RendererProps) {
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
    (e) => {
      preventAndStop(e);
      // avoid selection if block is already selected
      if (app.blockSelection && app.blockSelection.has(node.id)) return;
      app.tr.selectNodes([node.id]).dispatch();
    },
    [app.blockSelection, app.tr, node.id]
  );

  const handleMouseDown = useCallback(
    (e) => {
      if (app.blockSelection && app.blockSelection.has(node.id)) {
        e.preventDefault();
        e.stopPropagation();
      }
    },
    [app.blockSelection, node.id]
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
      >***</div>
      {selection.SelectionHalo}
    </CarbonBlock>
  );
}
