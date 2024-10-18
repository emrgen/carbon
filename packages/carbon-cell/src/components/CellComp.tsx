import { RendererProps, useCarbon } from "@emrgen/carbon-react";
import { CarbonBlock } from "@emrgen/carbon-react";
import { CarbonChildren } from "@emrgen/carbon-react";
import { CollapsedPath, preventAndStop } from "@emrgen/carbon-core";
import { HasFocusPath } from "@emrgen/carbon-core";
import { stop } from "@emrgen/carbon-core";
import { useMemo } from "react";
import { useCallback } from "react";
import { useEffect } from "react";
import { useState } from "react";
import { useModule } from "../hooks/useModule";

export const CellComp = (props: RendererProps) => {
  const { node } = props;
  const app = useCarbon();
  const mod = useModule();
  const [id] = useState(node.id.toString());

  console.log("CellComp", node.name, node.renderVersion);

  useEffect(() => {
    mod.redefine(node.id);
    return () => {
      console.log("UNMOUNTED", id);
    };
  }, [id, mod, node]);

  const isCollapsed = useMemo(() => {
    return node.props.get(CollapsedPath, false);
  }, [node]);

  const isFocused = useMemo(() => {
    return node.props.get(HasFocusPath, false);
  }, [node]);

  const handleToggleCell = useCallback(
    (e) => {
      preventAndStop(e);
      app.cmd.collapsible
        .toggle(node)
        .Dispatch()
        .Then(() => {
          // if the cell is collapsed, focus the cell after expanding
          if (isCollapsed) {
            mod.emit(`expand:${node.id.toString()}`, node);
          }
        });
    },
    [app, isCollapsed, mod, node],
  );

  return (
    <CarbonBlock node={node}>
      <div
        className={"carbon-cell-container"}
        onKeyUp={stop}
        onBeforeInput={stop}
      >
        <CarbonChildren node={node} />

        {/*<div className={"carbon-cell-view"}>*/}
        {/*  <div*/}
        {/*    className={"carbon-cell-handle"}*/}
        {/*    onClick={handleToggleCell}*/}
        {/*    onMouseDown={preventAndStop}*/}
        {/*    data-focused={isFocused}*/}
        {/*  >*/}
        {/*    <div className={"cell-view-handle"}>*/}
        {/*      <HiDotsVertical />*/}
        {/*      /!*{isCollapsed() ? <HiDotsVertical/> : "▾"}*!/*/}
        {/*    </div>*/}
        {/*  </div>*/}
        {/*  <CellViewComp node={node.child(0)!} />*/}
        {/*</div>*/}
        {/*<div*/}
        {/*  className={"carbon-cell-code"}*/}
        {/*  style={{*/}
        {/*    height: isCollapsed ? "0" : "auto",*/}
        {/*    overflow: isCollapsed ? "hidden" : "visible",*/}
        {/*  }}*/}
        {/*>*/}
        {/*  <div className={"carbon-cell-handle"} data-focused={isFocused}>*/}
        {/*    <div className={"cell-code-handle"}>{"{}"}</div>*/}
        {/*  </div>*/}
        {/*  <CarbonNode node={node.child(1)!} />*/}
        {/*</div>*/}
      </div>
    </CarbonBlock>
  );
};
