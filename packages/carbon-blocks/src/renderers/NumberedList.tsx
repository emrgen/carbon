import React, { useCallback, useMemo } from "react";
import {
  CarbonBlock,
  CarbonNodeChildren,
  CarbonNodeContent,
  RendererProps,
  useSelectionHalo,
  Node,
} from "@emrgen/carbon-core";

export const NumberedListComp = (props: RendererProps) => {
  const { node, version } = props;
  const { SelectionHalo } = useSelectionHalo(props);

  // const ref = useRef(null);
  // const { listeners } = useDragDropRectSelect({ node, ref });

  // watch the parent version for list number calculation
  const getListNumber = (node: Node): number => {
    if (node.prevSibling?.name === "numberedList") {
      return getListNumber(node.prevSibling) + 1;
    }
    return 1;
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
    <CarbonBlock {...props}>
      <CarbonNodeContent node={node} beforeContent={beforeContent} />
      <CarbonNodeChildren node={node} />
      {SelectionHalo}
    </CarbonBlock>
  );
};
