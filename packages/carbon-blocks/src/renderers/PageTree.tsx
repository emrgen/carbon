import {
  CarbonBlock,
  CarbonChildren,
  CarbonNodeChildren,
  CarbonNodeContent,
  preventAndStop,
  RendererProps,
  useCarbon
} from "@emrgen/carbon-core";
import { useCallback, useEffect } from "react";

export const PageTreeComp = (props: RendererProps) => {
  const { node } = props;
  const app = useCarbon();
  
  const handleToggleCollapse = useCallback(() => {
    const isCollapsed = node.attrs.get('node.collapsed', false);
    app.tr.updateAttrs(node, {'node.collapsed': !isCollapsed}).dispatch();
  },[app.tr, node]);

  useEffect(() => {
    console.log('PageTreeComp mounted');
  }, [handleToggleCollapse]);

  const firstChild = node.child(0);
  console.log(node.version, node.frozen);
  if (firstChild?.name === 'title') {
    const isCollapsed = node.attrs.get('node.collapsed');
    return (
      <CarbonBlock node={node} custom={{onMouseDown: preventAndStop}}>
        <CarbonNodeContent key={node.version} node={node} custom={{onClick: handleToggleCollapse}}/>
        {!isCollapsed && <CarbonNodeChildren node={node}/>}
      </CarbonBlock>
    );
  }

  return (
    <CarbonBlock node={node} custom={{onMouseDown: preventAndStop}}>
      <CarbonChildren node={node} />
    </CarbonBlock>
  );
};
