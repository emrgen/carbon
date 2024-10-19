import { RendererProps, useCarbon } from "@emrgen/carbon-react";
import { CarbonBlock } from "@emrgen/carbon-react";
import { CollapsedPath, preventAndStop } from "@emrgen/carbon-core";
import { HasFocusPath } from "@emrgen/carbon-core";
import { stop } from "@emrgen/carbon-core";
import { NodeId } from "@emrgen/carbon-core";
import { useMemo } from "react";
import { useCallback } from "react";
import { useState } from "react";
import { useModule } from "../hooks/useModule";
import { Code } from "./Code";
import { Result } from "./Result";
import { CodeCellCodeTypePath } from "../constants";
import { CodeCellCodeValuePath } from "../constants";

const codeTypes = ["javascript", "markdown", "html", "css"];
const codeIcons = {
  javascript: "{}",
  html: "H",
  markdown: "M",
  css: "C",
};

export const CellComp = (props: RendererProps) => {
  const { node } = props;
  const app = useCarbon();
  const mod = useModule();
  const [codeType, setCodeType] = useState(
    node.props.get(CodeCellCodeTypePath, "javascript"),
  );
  const [nodeId] = useState(node.id.toString());

  const isCollapsed = useMemo(() => {
    return node.props.get(CollapsedPath, false);
  }, [node]);

  const isFocused = useMemo(() => {
    return node.props.get(HasFocusPath, false);
  }, [node]);

  const handleToggleCell = useCallback(
    (e) => {
      preventAndStop(e);
      const tr = app.cmd.collapsible.toggle(node);
      tr.Update(node.id, {
        [HasFocusPath]: isCollapsed,
      });

      tr.Dispatch().Then(() => {
        // if the cell is collapsed, focus the cell after expanding
        if (isCollapsed) {
          mod.emit(`expand:${node.id.toString()}`, node);
        }
      });
    },
    [app, isCollapsed, mod, node],
  );

  const rotateCodeType = useCallback(() => {
    const index = codeTypes.indexOf(codeType);
    const next = (index + 1) % codeTypes.length;
    setCodeType(codeTypes[next]);
    const nid = NodeId.create(nodeId);
    app.cmd
      .Update(nid, {
        [CodeCellCodeTypePath]: codeTypes[next],
      })
      .Dispatch()
      .Then(() => {
        const node = app.store.get(nid);
        if (node) {
          mod.redefine(
            node.id.toString(),
            node.props.get(CodeCellCodeValuePath, ""),
            codeTypes[next],
          );
        }
      });
  }, [app, mod, codeType, nodeId]);

  return (
    <CarbonBlock node={node}>
      <div
        className={"carbon-cell-container"}
        onKeyUp={stop}
        onBeforeInput={stop}
      >
        <Result node={node} onToggle={handleToggleCell} />

        <div
          className={"carbon-cell-code"}
          style={{
            height: isCollapsed ? "0" : "auto",
            overflow: isCollapsed ? "hidden" : "visible",
          }}
        >
          <div
            className={"carbon-cell-handle"}
            data-focused={isFocused}
            onClick={rotateCodeType}
          >
            <div className={"cell-code-handle"}>{codeIcons[codeType]}</div>
          </div>
          <Code node={node} />
        </div>
      </div>
    </CarbonBlock>
  );
};
