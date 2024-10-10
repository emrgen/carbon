import React, { useMemo, useRef } from "react";
import { Node } from "@emrgen/carbon-core";
import { useDragDropRectSelectHalo } from "@emrgen/carbon-dragon-react";
import { Optional } from "@emrgen/types";
import {
  CarbonBlock,
  CarbonNodeChildren,
  CarbonNodeContent,
  RendererProps,
} from "@emrgen/carbon-react";

// TODO: This is a hack to get the list number. May be should be stored in the node properties.
const listNumber = (node: Node, parent: Optional<Node>): number => {
  if (!parent) {
    return 1;
  }

  let result = 0;
  for (const child of parent?.children) {
    if (child.name === "numberList") {
      result += 1;
      if (child.eq(node)) {
        return result;
      }
    } else {
      result = 0;
    }
  }

  return -1;
};

export const NumberedListComp = (props: RendererProps) => {
  const { node, parent, custom } = props;
  const ref = useRef(null);
  const { connectors, SelectionHalo } = useDragDropRectSelectHalo({
    ref,
    node,
  });

  const beforeContent = useMemo(() => {
    return (
      <label
        contentEditable="false"
        suppressContentEditableWarning
        className="cnl__label"
      >
        {listNumber(node, node.parent) + "."}
      </label>
    );
  }, [node]);

  return (
    <CarbonBlock {...props} custom={connectors} ref={ref}>
      <CarbonNodeContent
        node={node}
        beforeContent={beforeContent}
        wrap={true}
        className={"ctiw"}
        custom={{ className: "cnl__ti" }}
      />
      <CarbonNodeChildren node={node} wrap={true} className="cnest" />
      {SelectionHalo}
    </CarbonBlock>
  );
};
