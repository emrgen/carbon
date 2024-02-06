import React, { useCallback, useMemo, useRef } from "react";
import {
  CheckedPath, stop, preventAndStop
} from "@emrgen/carbon-core";
import {CarbonBlock, CarbonNodeChildren, CarbonNodeContent, RendererProps, useCarbon, useSelectionHalo} from "@emrgen/carbon-react";
import {useCombineConnectors, useConnectorsToProps, useDragDropRectSelect} from "@emrgen/carbon-dragon-react";

export default function MCQComp(props: RendererProps) {
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
    () => {
      app.cmd.switch.toggle(node);
    },
    [app, node]
  );


  const beforeContent = useMemo(() => {
    return (
      <div
        className="carbon-mcq__control"
        contentEditable="false"
        suppressContentEditableWarning
        onMouseDown={preventAndStop}
        onInput={preventAndStop}
        onClick={stop(() => handleClick())}
      >
        <div className={'mcq-control-wrapper'} data-checked={isChecked}>
          <div className={'mcq-selected-hint'}/>
        </div>
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
