import {
  Carbon, preventAndStop,

} from "@emrgen/carbon-core";
import { useCallback, useEffect, useMemo } from "react";
import { usePrevious } from "@uidotdev/usehooks";
import {CarbonBlock, CarbonNodeChildren, CarbonNodeContent, RendererProps, useCarbon} from "@emrgen/carbon-react";

export const PageTreeComp = (props: RendererProps) => {
  const { node } = props;
  const app = useCarbon();

  const handleToggleCollapse = useCallback((app: Carbon) => {
    app.cmd.collapsible.toggle(node).Dispatch();
  },[node]);

  const content = useMemo(() => {
    if(node.firstChild?.name === 'title') {
      return (
        <>
          <CarbonNodeContent node={node} key={node.key} custom={{onClick: () => handleToggleCollapse(app)}}/>
          {!node.isCollapsed && <CarbonNodeChildren node={node}/>}
        </>
      )
    } else {
      return (
        <CarbonNodeChildren node={node}/>
      )
    }
  },[handleToggleCollapse, node]);

  return (
    <CarbonBlock node={node} custom={{onMouseDown: preventAndStop}}>
      {content}
    </CarbonBlock>
  );
};
