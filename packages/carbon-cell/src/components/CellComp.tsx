import { RendererProps, useCarbon } from "@emrgen/carbon-react";
import { CarbonBlock } from "@emrgen/carbon-react";
import { CollapsedPath, preventAndStop } from "@emrgen/carbon-core";
import { HasFocusPath } from "@emrgen/carbon-core";
import { stop } from "@emrgen/carbon-core";
import { useRef } from "react";
import { useEffect } from "react";
import { useMemo } from "react";
import { useCallback } from "react";
import { CellViewComp } from "./CellViewComp";
import { CellCodeComp } from "./CellCodeComp";
import { useCodeEditor } from "../hooks/useCodeEditor";
import { CodeCellValuePath } from "../constants";
import { useModule } from "../hooks/useModule";
import { HiDotsVertical } from "react-icons/hi";

export const CellComp = (props: RendererProps) => {
  const { node } = props;
  const app = useCarbon();

  const mod = useModule();
  const ref = useRef();
  const { setContainer, view } = useCodeEditor(
    node.child(1)!,
    node.child(1)!.props.get(CodeCellValuePath),
    ref,
  );

  useEffect(() => {
    setContainer(ref.current);
  }, [ref, setContainer]);

  useEffect(() => {
    mod.add(node);
  }, [mod, node]);

  const isCollapsed = useMemo(() => {
    return node.props.get(CollapsedPath, false);
  }, [node]);

  const isFocused = () => {
    return node.props.get(HasFocusPath, false);
  };

  const handleToggleCell = useCallback(
    (e) => {
      preventAndStop(e);
      app.cmd.collapsible.toggle(node).dispatch();
      setTimeout(() => {
        view?.focus();
      }, 100);
    },
    [app, node, view],
  );

  return (
    <CarbonBlock node={node}>
      <div
        className={"carbon-cell-container"}
        onKeyUp={stop}
        onBeforeInput={stop}
      >
        <div className={"carbon-cell-view"}>
          <div
            className={"carbon-cell-handle"}
            onClick={handleToggleCell}
            onMouseDown={preventAndStop}
            data-focused={isFocused()}
          >
            <div className={"cell-view-handle"}>
              <HiDotsVertical />
              {/*{isCollapsed() ? <HiDotsVertical/> : "▾"}*/}
            </div>
          </div>
          <CellViewComp node={node.child(0)!} />
        </div>
        <div
          className={"carbon-cell-code"}
          style={{
            height: isCollapsed ? "0" : "auto",
            overflow: isCollapsed ? "hidden" : "visible",
          }}
        >
          <div className={"carbon-cell-handle"} data-focused={isFocused()}>
            <div className={"cell-code-handle"}>{"{}"}</div>
          </div>
          <CellCodeComp
            node={node.child(1)!}
            onMount={(el) => (ref.current = el)}
          />
        </div>
      </div>
    </CarbonBlock>
  );
};
