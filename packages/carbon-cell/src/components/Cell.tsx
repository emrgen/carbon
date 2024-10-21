import { RendererProps, useCarbon } from "@emrgen/carbon-react";
import { CarbonBlock } from "@emrgen/carbon-react";
import { CollapsedPath, preventAndStop } from "@emrgen/carbon-core";
import { HasFocusPath } from "@emrgen/carbon-core";
import { stop } from "@emrgen/carbon-core";
import { NodeId } from "@emrgen/carbon-core";
import { useMemo } from "react";
import { useCallback } from "react";
import { useState } from "react";
import { useActiveCellRuntime } from "../hooks/useActiveCellRuntime";
import { Code } from "./Code";
import { Result } from "./Result";
import { CodeCellCodeTypePath } from "../constants";
import { CodeCellCodeValuePath } from "../constants";
import { BsTextParagraph } from "react-icons/bs";
import { DiCssTricks } from "react-icons/di";
import { useCustomCompareEffect } from "react-use";
import { BiPlus } from "react-icons/bi";

const codeTypes = ["javascript", "markdown", "html", "css"];
const codeIcons = {
  javascript: "{}",
  html: "<>",
  markdown: <BsTextParagraph />,
  css: <DiCssTricks />,
};

export const CellComp = (props: RendererProps) => {
  const { node } = props;
  const app = useCarbon();
  const mod = useActiveCellRuntime();
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

  useCustomCompareEffect(
    () => {
      const codeType = node.props.get(CodeCellCodeTypePath, "javascript");
      mod.redefine(
        "",
        nodeId,
        node.props.get(CodeCellCodeValuePath, ""),
        codeType,
      );
    },
    [node, mod],
    (prev, next) => {
      // @ts-ignore
      return prev[0].eq(next[0]);
    },
  );

  const rotateCodeType = useCallback(() => {
    const nid = NodeId.fromString(nodeId);
    const node = app.store.get(nid);
    const code = node?.props.get(CodeCellCodeValuePath, "") ?? "";
    const index = codeTypes.indexOf(codeType);
    const next = (index + 1) % codeTypes.length;
    const nextCodeType = codeTypes[next];

    const update = () => {
      app.cmd
        .Update(nid, {
          [CodeCellCodeTypePath]: nextCodeType,
        })
        .Dispatch()
        .Then(() => {
          if (node) {
            mod.redefine("", nodeId, code, codeTypes[next]);
          }
          setCodeType(codeTypes[next]);
        });
      setCodeType(nextCodeType);
    };
    update();
  }, [app, mod, codeType, nodeId]);

  const handleInsertNeighbour = useCallback(
    (e) => {
      if (e.shiftKey) {
        // console.log("insert above");
        app.cmd.inserter
          .insertBeforeDefault(node.parent!, "section")
          ?.dispatch();
      } else {
        // console.log("insert below");
        app.cmd.inserter
          .insertAfterDefault(node.parent!, "section")
          ?.Dispatch();
      }
    },
    [app, node],
  );

  return (
    <CarbonBlock node={node}>
      <div
        className={"cell-insert-neighbour"}
        onClick={handleInsertNeighbour}
        onMouseDown={handleInsertNeighbour}
      >
        <BiPlus />
      </div>
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
