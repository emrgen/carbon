import React, { useCallback, useMemo, useRef } from "react";
import {
  CarbonBlock,
  CarbonNodeChildren,
  CarbonNodeContent,
  RendererProps,
  preventAndStop,
  useCarbon,
  useNodeAttrs,
  useNodeStateChange,
  useSelectionHalo,
} from "@emrgen/carbon-core";
import {
  useCombineConnectors,
  useConnectorsToProps,
  useDragDropRectSelect,
} from "@emrgen/carbon-dragon";
import { usePlaceholder } from "@emrgen/carbon-blocks";

import { Checkbox } from "@chakra-ui/react";

export function TodoComp(props: RendererProps) {
  const { node } = props;
  const app = useCarbon();
  const attrs = useNodeAttrs(props);
  const ref = useRef(null);

  const selection = useSelectionHalo(props);
  const dragDropRect = useDragDropRectSelect({ node, ref });
  const connectors = useConnectorsToProps(
    useCombineConnectors(dragDropRect, selection)
  );

  const placeholder = usePlaceholder(node);

  const handleClick = useCallback(
    (e) => {
      e.stopPropagation();

      app.tr
        .updateAttrs(node.id, {
          node: {
            isChecked: !attrs.get('node.isChecked'),
          },
        })
        .dispatch();
    },
    [app.tr, node.id, attrs]
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
          defaultChecked={node.attrs.node.isChecked}
          checked={node.attrs.node.isChecked}
          onChange={handleClick}
        />
      </div>
    );
  }, [handleClick, node.attrs]);

  return (
    <CarbonBlock node={node} ref={ref} custom={connectors}>
      <CarbonNodeContent
        node={node}
        beforeContent={beforeContent}
        custom={placeholder}
      />
      <CarbonNodeChildren node={node} />
      {selection.SelectionHalo}
    </CarbonBlock>
  );
}
