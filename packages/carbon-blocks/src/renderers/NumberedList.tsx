import React, { useCallback, useMemo, useRef } from "react";
import {
  CarbonBlock,
  CarbonNodeChildren,
  CarbonNodeContent,
  RendererProps,
  useSelectionHalo,
  Node,
} from "@emrgen/carbon-core";
import { useCombineConnectors, useConnectorsToProps, useDragDropRectSelect } from "@emrgen/carbon-dragon";

export const NumberedListComp = (props: RendererProps) => {
  const { node, version } = props;


  const ref = useRef(null);

  const selection = useSelectionHalo(props);
  const dragDropRect = useDragDropRectSelect({ node, ref });
  const connectors = useConnectorsToProps(
    useCombineConnectors(dragDropRect, selection)
  );
  // watch the parent version for list number calculation
  const getListNumber = (node: Node): number => {
    if (node.prevSibling?.name === "numberedList") {
      return getListNumber(node.prevSibling) + 1;
    }

    return node.data.node.listNumber ?? 1;
  };

  const beforeContent = (
    <label
      contentEditable="false"
      suppressContentEditableWarning
      className="carbon-numberedList__label"
    >
      {getListNumber(node) + "."}
    </label>
  );

  return (
    <CarbonBlock {...props} custom={connectors} ref={ref}>
      <CarbonNodeContent
        node={node}
        beforeContent={beforeContent}
        placeholder={node.isEmpty ? "List" : ""}
      />
      <CarbonNodeChildren node={node} />
      {selection.SelectionHalo}
    </CarbonBlock>
  );
};
