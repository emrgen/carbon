import { Node } from "@emrgen/carbon-core";
import { useDragDropRectSelectHalo } from "@emrgen/carbon-dragon-react";
import {
  CarbonBlock,
  CarbonNodeChildren,
  CarbonNodeContent,
  RendererProps,
} from "@emrgen/carbon-react";
import { Optional } from "@emrgen/types";
import React, { useMemo, useRef } from "react";

const timelineNumber = (node: Node, parent: Optional<Node>): number => {
  if (!parent) {
    return 1;
  }

  let result = 0;
  for (const child of parent?.children) {
    if (child.name === "timeline") {
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

export const TimelineComp = (props: RendererProps) => {
  const { node } = props;
  const ref = useRef(null);
  const { connectors, SelectionHalo } = useDragDropRectSelectHalo({
    ref,
    node,
  });
  const nodeNumber = useMemo(() => timelineNumber(node, node.parent), [node]);

  const beforeContent = useMemo(() => {
    return (
      <label
        contentEditable="false"
        suppressContentEditableWarning
        className="carbon-timeline-index"
      >
        {nodeNumber}
      </label>
    );
  }, [nodeNumber]);

  return (
    <CarbonBlock {...props} custom={connectors} ref={ref}>
      {node.nextSibling?.name === node.name && (
        <div className={"timeline-connector"} contentEditable={false} />
      )}

      <CarbonNodeContent
        node={node}
        beforeContent={beforeContent}
        wrap={true}
        className={"ctiw"}
      />
      <CarbonNodeChildren node={node} />
      {SelectionHalo}
    </CarbonBlock>
  );
};