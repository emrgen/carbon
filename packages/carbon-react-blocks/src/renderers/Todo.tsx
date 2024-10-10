import React, { useCallback, useMemo, useRef } from "react";
import { CheckedPath, preventAndStop, stop } from "@emrgen/carbon-core";
import {
  CarbonBlock,
  CarbonNodeChildren,
  CarbonNodeContent,
  RendererProps,
  useCarbon,
  useSelectionHalo,
} from "@emrgen/carbon-react";
import {
  useCombineConnectors,
  useConnectorsToProps,
  useDragDropRectSelect,
} from "@emrgen/carbon-dragon-react";

export default function TodoComp(props: RendererProps) {
  const { node, custom } = props;
  const app = useCarbon();
  const ref = useRef(null);

  const selection = useSelectionHalo(props);
  const dragDropRect = useDragDropRectSelect({ node, ref });
  const connectors = useConnectorsToProps(
    useCombineConnectors(dragDropRect, selection),
  );

  const isChecked = useMemo(() => {
    return !!node.props.get(CheckedPath);
  }, [node.props]);

  const handleClick = useCallback(() => {
    app.cmd.switch.toggle(node);
  }, [app, node]);

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
    <CarbonBlock {...props} ref={ref} custom={{ ...connectors, ...custom }}>
      <CarbonNodeContent
        node={node}
        beforeContent={beforeContent}
        wrap={true}
      />
      <CarbonNodeChildren node={node} />
      {selection.SelectionHalo}
    </CarbonBlock>
  );
}
