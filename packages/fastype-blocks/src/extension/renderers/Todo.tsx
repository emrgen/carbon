import React, { useCallback, useMemo, useRef } from "react";
import {
  CarbonBlock,
  CarbonNodeChildren,
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

import { Checkbox } from "@chakra-ui/react";
import { CheckedPath } from "@emrgen/carbon-core/src/core/NodeProps";

export function TodoComp(props: RendererProps) {
  const { node } = props;
  const app = useCarbon();
  const ref = useRef(null);

  const selection = useSelectionHalo(props);
  const dragDropRect = useDragDropRectSelect({ node, ref });
  const connectors = useConnectorsToProps(
    useCombineConnectors(dragDropRect, selection)
  );

  const isChecked = useMemo(() => {
    return !!node.properties.get(CheckedPath);
  },[node.properties])

  const handleClick = useCallback(
    (e, app) => {
      e.stopPropagation();

      app.tr
        .updateProps(node.id, {
          node: {
            checked: !isChecked,
          },
        })
        .dispatch();
    },
    [node.id, isChecked]
  );

  const beforeContent = useMemo(() => {
    return (
      <div
        className="carbon-todo__control"
        contentEditable="false"
        suppressContentEditableWarning
        onMouseDown={preventAndStop}
        onInput={preventAndStop}
      >
        <Checkbox
          defaultChecked={isChecked}
          checked={isChecked}
          onChange={(e) => handleClick(e, app)}
        />
      </div>
    );
  }, [handleClick, node.properties]);

  return (
    <CarbonBlock node={node} ref={ref} custom={connectors}>
      <CarbonNodeContent
        node={node}
        beforeContent={beforeContent}
      />
      <CarbonNodeChildren node={node} />
      {selection.SelectionHalo}
    </CarbonBlock>
  );
}
