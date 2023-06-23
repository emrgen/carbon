import React, { useCallback, useMemo } from "react";
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

export default function CheckedListComp(props: RendererProps) {
  const { node } = props;
  const { SelectionHalo } = useSelectionHalo(props);
  const app = useCarbon();
  const attrs = useNodeAttrs(props);

  const handleClick = useCallback(
    (e) => {
      e.stopPropagation();

      app.tr
        .updateAttrs(node.id, {
          node: {
            isChecked: !attrs.node.isChecked,
          },
        })
        .dispatch();
    },
    [app.tr, node.id, attrs]
  );

  const beforeContent = useMemo(() => {
    console.log(attrs.node.isChecked);

    return (
      <div
        className="carbon-checkedList__control"
        contentEditable="false"
        suppressContentEditableWarning
      >
        <input type="checkbox" onChange={handleClick} />
      </div>
    );
  }, [handleClick, attrs]);

  return (
    <CarbonBlock {...props}>
      <CarbonNodeContent node={node} beforeContent={beforeContent} />
      <CarbonNodeChildren node={node} />
      {SelectionHalo}
    </CarbonBlock>
  );
}
