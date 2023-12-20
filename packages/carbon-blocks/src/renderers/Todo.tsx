import React, { useCallback, useMemo, useRef } from "react";
import {
  CarbonBlock,
  CarbonNodeChildren,
  CarbonNodeContent,
  RendererProps,
  preventAndStop,
  useCarbon,
  useSelectionHalo,
  CheckedPath,
} from "@emrgen/carbon-core";
import { useCombineConnectors, useConnectorsToProps, useDragDropRectSelect } from "@emrgen/carbon-dragon";

export default function TodoComp(props: RendererProps) {
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
      app.cmd.updateProps(node.id, {[CheckedPath]: !isChecked}).Dispatch();
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
        <input
          type="checkbox"
          onChange={(e) => handleClick(e, app)}
          checked={isChecked}
        />
      </div>
    );
  }, [handleClick, node.properties]);

  return (
    <CarbonBlock {...props} ref={ref} custom={connectors}>
      <CarbonNodeContent
        node={node}
        beforeContent={beforeContent}
      />
      <CarbonNodeChildren node={node} />
      {selection.SelectionHalo}
    </CarbonBlock>
  );
}
