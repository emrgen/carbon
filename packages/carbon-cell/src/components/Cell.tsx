import {
  CollapsedPath,
  HasFocusPath,
  NodeId,
  preventAndStop,
  stop,
} from "@emrgen/carbon-core";
import {
  CarbonBlock,
  RendererProps,
  useCarbon,
  useNodeChange,
} from "@emrgen/carbon-react";
import { useCallback, useMemo, useState } from "react";
import { BsTextParagraph } from "react-icons/bs";
import { DiCssTricks } from "react-icons/di";
import { useCustomCompareEffect } from "react-use";
import { CodeCellCodeTypePath, CodeCellCodeValuePath } from "../constants";
import { useActiveCellRuntime } from "../hooks/useActiveCellRuntime";
import { Code } from "./Code";
import { Result } from "./Result";

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

  const handleInsertNeighbour = useCallback(
    (e) => {
      if (e.shiftKey) {
        // console.log("insert above");
        app.cmd.inserter
          .insertBeforeDefault(node.parent!, "paragraph")
          ?.Dispatch();
      } else {
        // console.log("insert below");
        app.cmd.inserter
          .insertAfterDefault(node.parent!, "paragraph")
          ?.Dispatch();
      }
    },
    [app, node],
  );

  return (
    <CarbonBlock node={node}>
      {/*<div className={"cell-insert-neighbour"} onClick={handleInsertNeighbour}>*/}
      {/*  <BiPlus />*/}
      {/*</div>*/}
      <CodeCellWrapper node={node.linkedProps!} />
    </CarbonBlock>
  );
};

const CodeCellWrapper = (props: RendererProps) => {
  const app = useCarbon();
  const mod = useActiveCellRuntime();
  const { node } = useNodeChange({ node: props.node });

  const [codeType, setCodeType] = useState(
    node.props.get(CodeCellCodeTypePath, "javascript"),
  );
  const [nodeId] = useState(node.id.toString());

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

  const isFocused = useMemo(() => {
    return node.props.get(HasFocusPath, false);
  }, [node]);
  const isCollapsed = useMemo(() => {
    return node.props.get(CollapsedPath, false);
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

  return (
    <CarbonBlock node={node}>
      <div
        className={"carbon-cell-container"}
        onKeyUp={stop}
        onBeforeInput={stop}
      >
        <Result node={node} onToggle={handleToggleCell} />
        <Code node={node} />
        {/*<div*/}
        {/*  className={"carbon-cell-code"}*/}
        {/*  style={{*/}
        {/*    height: isCollapsed ? "0" : "auto",*/}
        {/*    overflow: isCollapsed ? "hidden" : "visible",*/}
        {/*  }}*/}
        {/*>*/}
        {/*  <div*/}
        {/*    className={"carbon-cell-handle"}*/}
        {/*    data-focused={isFocused}*/}
        {/*    onClick={rotateCodeType}*/}
        {/*  >*/}
        {/*    <div className={"cell-code-handle"}>{codeIcons[codeType]}</div>*/}
        {/*  </div>*/}
        {/*  <Code node={node} />*/}
        {/*</div>*/}
      </div>
    </CarbonBlock>
  );
};
