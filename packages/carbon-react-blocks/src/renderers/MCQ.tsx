import {
  CheckedPath,
  isContentEditable,
  preventAndStop,
  stop,
} from "@emrgen/carbon-core";
import {
  useCombineConnectors,
  useConnectorsToProps,
  useDragDropRectSelect,
} from "@emrgen/carbon-dragon-react";
import {
  CarbonBlock,
  CarbonNodeChildren,
  CarbonNodeContent,
  RendererProps,
  useCarbon,
  useSelectionHalo,
} from "@emrgen/carbon-react";
import React, { useCallback, useMemo, useRef } from "react";
import { useDocument } from "../hooks";

export default function MCQComp(props: RendererProps) {
  const { node } = props;
  const app = useCarbon();
  const ref = useRef(null);
  const { doc } = useDocument();

  const selection = useSelectionHalo(props);
  const dragDropRect = useDragDropRectSelect({ node, ref });
  const connectors = useConnectorsToProps(
    useCombineConnectors(dragDropRect, selection),
  );

  const isChecked = useMemo(() => {
    return !!node.props.get(CheckedPath);
  }, [node.props]);

  // toggle the checked state of mcq option
  const handleClick = useCallback(() => {
    app.cmd.switch.toggle(node);
  }, [app, node]);

  // prevent click if content is editable
  const handleContentClick = useCallback(
    (e: React.MouseEvent) => {
      if (!isContentEditable(doc)) {
        handleClick();
      }
    },
    [document, handleClick],
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
        <div className={"mcq-control-wrapper"} data-checked={isChecked}>
          <div className={"mcq-selected-hint"} />
        </div>
      </div>
    );
  }, [handleClick, isChecked]);

  return (
    <CarbonBlock {...props} ref={ref} custom={connectors}>
      <CarbonNodeContent
        node={node}
        beforeContent={beforeContent}
        wrapper={{ onClick: handleContentClick }}
      />
      <CarbonNodeChildren node={node} />
      {selection.SelectionHalo}
    </CarbonBlock>
  );
}
