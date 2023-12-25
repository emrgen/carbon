import React, { useCallback, useMemo, useRef } from "react";
import {
  RendererProps,
  CheckedPath, stop, preventAndStop
} from "@emrgen/carbon-core";
import { useCombineConnectors, useConnectorsToProps, useDragDropRectSelect } from "@emrgen/carbon-dragon";
import {CarbonBlock, CarbonNodeChildren, CarbonNodeContent, useCarbon, useSelectionHalo} from "@emrgen/carbon-react";

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
    () => {
      app.cmd.switch.toggle(node);
    },
    [app, node]
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
          onChange={stop(() => handleClick())}
          checked={isChecked}
        />
      </div>
    );
  }, [handleClick, isChecked]);

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
