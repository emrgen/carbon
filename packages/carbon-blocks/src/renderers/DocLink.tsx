import React, { useCallback, useRef } from "react";
import {
  CarbonBlock,
  CarbonNodeChildren,
  CarbonNodeContent,
  RendererProps,
  useSelectionHalo,
} from "@emrgen/carbon-core";

export const DocLinkComp = (props: RendererProps) => {
  const { node } = props;
  const ref = useRef(null);
  const { attributes, SelectionHalo } = useSelectionHalo(props);

  // const { listeners } = useDragDropRectSelect({ node, ref });
  // console.log(attributes);
  // console.log(node.attrs.node.emptyPlaceholder, node.name);

  const beforeContent = (
    <div className="carbon-doc-link-icon">
    🔗
    </div>
  );

  const onClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('redirect to another doc');
  }, [])

  return (
    <CarbonBlock node={node} ref={ref} custom={{ ...attributes, onClick }}>
      <CarbonNodeContent node={node} beforeContent={beforeContent}/>
      {SelectionHalo}
    </CarbonBlock>
  );
};
