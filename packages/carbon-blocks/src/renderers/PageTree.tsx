import {
  CarbonBlock,
  CarbonChildren,
  CarbonNodeChildren,
  CarbonNodeContent,
  preventAndStop,
  RendererProps,
  useCarbon
} from "@emrgen/carbon-core";
import { useCallback, useEffect, useRef, useState } from "react";

const CollapsibleTitle = (props: RendererProps) => {
  const { node } = props;
}

export const PageTreeComp = (props: RendererProps) => {
  const { node } = props;
  const app = useCarbon();

  // while the pageTree is collapsed, we don't want to re-render the children
  const isCollapsed = useRef(node.attrs.get('node.collapsed', false));

  const handleToggleCollapse = useCallback(() => {
    isCollapsed.current = !isCollapsed.current;
    app.tr.updateAttrs(node, {'node.collapsed': isCollapsed.current}).dispatch();
  },[app.tr, isCollapsed, node]);


  const firstChild = node.child(0);
  if (firstChild?.name === 'title') {
    return (
      <CarbonBlock node={node} custom={{onMouseDown: preventAndStop}}>
        <CarbonNodeContent node={node} custom={{onClick: handleToggleCollapse}}/>
        {!isCollapsed.current && <CarbonNodeChildren node={node}/>}
      </CarbonBlock>
    );
  }

  return (
    <CarbonBlock node={node} custom={{onMouseDown: preventAndStop}}>
      <CarbonChildren node={node} />
    </CarbonBlock>
  );
};
