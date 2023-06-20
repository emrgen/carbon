import {
  CarbonBlock,
  CarbonNodeChildren,
  CarbonNodeContent,
  RendererProps,
  useSelectionHalo,
} from "@emrgen/carbon-core";
import React, { useMemo } from "react";

export const BulletedListComp = (props: RendererProps) => {
  const { node } = props;
  const { SelectionHalo } = useSelectionHalo(props);

  // const ref = useRef(null);
  // const { listeners } = useDragDropRectSelect({ node, ref });

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
    <CarbonBlock {...props}>
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
