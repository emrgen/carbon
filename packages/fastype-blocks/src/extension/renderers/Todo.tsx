import React, { useCallback, useMemo, useRef } from "react";
import {
  preventAndStop,
} from "@emrgen/carbon-core";


import { Checkbox } from "@chakra-ui/react";
import { CheckedPath } from "packages/carbon-core/src/core/NodeProps";
import {CarbonBlock, CarbonNodeChildren, CarbonNodeContent, RendererProps, useCarbon, useSelectionHalo} from "@emrgen/carbon-react";
import {useCombineConnectors, useConnectorsToProps, useDragDropRectSelect} from "@emrgen/carbon-dragon-react";

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
    return !!node.props.get(CheckedPath);
  },[node.props])

  const handleClick = useCallback(
    (e, app) => {
      e.stopPropagation();

      app.tr
        .updateProps(node.id, {
          node: {
            checked: !isChecked,
          },
        })
        .Dispatch();
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
  }, [app, handleClick, isChecked]);

  return (
    <CarbonBlock node={node} ref={ref as any} custom={connectors}>
      <CarbonNodeContent
        node={node}
        beforeContent={beforeContent}
      />
      <CarbonNodeChildren node={node} />
      {selection.SelectionHalo}
    </CarbonBlock>
  );
}
