import {
  CarbonBlock,
  CarbonNodeChildren,
  CarbonNodeContent,
  RendererProps,
  useSelectionHalo,
} from "@emrgen/carbon-core";
import { useCombineConnectors, useConnectorsToProps, useDragDropRectSelect } from "@emrgen/carbon-dragon";
import React, { useMemo, useRef } from "react";

export const BulletedListComp = (props: RendererProps) => {
  const { node } = props;
  const { SelectionHalo } = useSelectionHalo(props);

  const ref = useRef(null);

  const selection = useSelectionHalo(props);
  const dragDropRect = useDragDropRectSelect({ node, ref });
  const connectors = useConnectorsToProps(
    useCombineConnectors(dragDropRect, selection)
  );

  const beforeContent = useMemo(() => {
    return (
      <div
        contentEditable="false"
        suppressContentEditableWarning
        className="carbon-bulletedList__label"
      >
        ●
      </div>
    );
  }, []);

  return (
    <CarbonBlock {...props} custom={connectors} ref={ref}>
      <CarbonNodeContent
        node={node}
        beforeContent={beforeContent}
        // wrapper={{ contentEditable: false }}
        // custom={{ contentEditable: true }}
      />
      <CarbonNodeChildren node={node} />
      {SelectionHalo}
    </CarbonBlock>
  );
};
