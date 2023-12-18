import React, { useCallback, useEffect, useRef } from "react";
import {
  CarbonBlock,
  CarbonNodeChildren,
  CarbonNodeContent,
  RendererProps,
  useSelectionHalo,
  Node,
  ListNumberPath,
} from "@emrgen/carbon-core";
import { useCombineConnectors, useConnectorsToProps, useDragDropRectSelect } from "@emrgen/carbon-dragon";
import { Optional } from "@emrgen/types";

// watch the parent version for list number calculation
const getListNumber = (node: Node): number => {
  console.log("prev", node.id.toString(), node.prevSibling?.id.toString());
  if(node.prevSibling?.eq(node)) {
    return -1;
  }
  if (node.prevSibling?.name === "numberedList") {

    return getListNumber(node.prevSibling) + 1;
  }

  return node.properties.get(ListNumberPath) ?? 1;
}

const listNumber = (node: Node, parent: Optional<Node>): number => {
  if (!parent) {
    return 1;
  }

  let result = 0;
  for (const child of parent?.children) {
    if (child.name === "numberedList") {
      result += 1;
      if (child.eq(node)) {
        return result;
      }
    } else {
      result = 0;
    }
  }

  return -1;
}

export const NumberedListComp = (props: RendererProps) => {
  const { node, parent } = props;
  const ref = useRef(null);
  const selection = useSelectionHalo(props);
  const dragDropRect = useDragDropRectSelect({ node, ref });
  const connectors = useConnectorsToProps(
    useCombineConnectors(dragDropRect, selection),
  );

  const beforeContent = (
    <label
      contentEditable="false"
      suppressContentEditableWarning
      className="carbon-numberedList__label"
    >
      {listNumber(node, node.parent) + "."}
    </label>
  );

  return (
    <CarbonBlock {...props} custom={connectors} ref={ref}>
      <CarbonNodeContent
        node={node}
        // parent={parent}
        beforeContent={beforeContent}
      />
      <CarbonNodeChildren node={node}/>
      {selection.SelectionHalo}
    </CarbonBlock>
  );
};
