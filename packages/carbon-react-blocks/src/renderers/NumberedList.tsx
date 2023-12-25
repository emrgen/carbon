import React, { useCallback, useEffect, useMemo, useRef } from "react";
import {
  ListNumberPath, RendererProps,Node,
} from "@emrgen/carbon-core";
import { useCombineConnectors, useConnectorsToProps, useDragDropRectSelect } from "@emrgen/carbon-dragon";
import { Optional } from "@emrgen/types";
import {CarbonBlock, CarbonNodeChildren, CarbonNodeContent, useSelectionHalo} from "@emrgen/carbon-react";

// TODO: This is a hack to get the list number. May be should be stored in the node properties.
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
  const { node, parent, custom } = props;
  const ref = useRef(null);
  const selection = useSelectionHalo(props);
  const dragDropRect = useDragDropRectSelect({ node, ref });
  const connectors = useConnectorsToProps(
    useCombineConnectors(dragDropRect, selection),
  );

  const beforeContent = useMemo(() => {
    return (<label
      contentEditable="false"
      suppressContentEditableWarning
      className="carbon-numberedList__label"
    >
      {listNumber(node, node.parent) + "."}
    </label>)
  },[node]);

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
