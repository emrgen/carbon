import { useState } from "react";
import { useRef } from "react";
import { memo } from "react";
import { useMemo } from "react";
import { useEffect } from "react";
import { useActiveCellRuntime } from "../hooks/useActiveCellRuntime";
import { isArray } from "lodash";
import { isFunction } from "lodash";
import { isNumber } from "lodash";
import { isString } from "lodash";
import { isObject } from "lodash";
import { Cell } from "../core/ActiveCellRuntime";
import { Optional } from "@emrgen/types";
import { isHtmlElement } from "../utils";
import { isScriptElement } from "../utils";
import { isStyleElement } from "../utils";
import createDOMPurify from "dompurify";
import { ObjectViewer } from "@emrgen/carbon-object-view";
import { HiDotsVertical } from "react-icons/hi";
import { preventAndStop } from "@emrgen/carbon-core";
import { HasFocusPath } from "@emrgen/carbon-core";

const DOMPurify = createDOMPurify(window);

const NOT_LOADED = "__NOT_LOADED__";

const ResultInner = (props) => {
  const { node, onToggle } = props;
  const mod = useActiveCellRuntime();

  const [nodeId] = useState(node.id.toString());
  const [cell, setCell] = useState<Optional<Cell>>(
    mod.cell(node.id.toString()),
  );
  const [result, setResult] = useState<any>(NOT_LOADED);
  const [error, setError] = useState<string>("");
  const [html, setHtml] = useState<Optional<string>>(null);
  const [cellName, setCellName] = useState<string>(cell?.name ?? "");
  const [pending, setPending] = useState(false);

  const isFocused = useMemo(() => {
    return node.props.get(HasFocusPath, false);
  }, [node]);

  // const codeType = useMemo(() => {
  //   return node.props.get(CodeCellCodeTypePath, "javascript");
  // }, [node]);
  //
  // useEffect(() => {
  //   if (cell && cell.codeType !== codeType) {
  //     setResult(cell.result);
  //   }
  // }, [cell, codeType]);

  // if the cell is updated in the runtime, update the cell state
  useEffect(() => {
    const cell = mod.cell(nodeId);
    setCell((old) => {
      return old === cell ? old : cell;
    });
  }, [mod, nodeId]);

  const updateResult = (res) => {
    if (isFunction(res)) {
      setResult(() => res);
    } else {
      setResult(res);
    }
  };

  // listen to the cell events from the module
  useEffect(() => {
    const onDefine = (cell: Cell) => {
      setError("");
      setCell(cell);
      setCellName(cell.name);
      setPending(false);
    };

    const onDelete = (cell: Cell) => {
      setCellName("");
      setError("");
      setCell(null);
      // updateResult(null);
      setPending(false);
    };

    const onError = (err: Error) => {
      setCellName("");
      setError(err.toString());
      updateResult(null);
      setPending(false);
    };

    mod.onDefine(nodeId, onDefine);
    mod.onDelete(nodeId, onDelete);
    mod.onError(nodeId, onError);
    return () => {
      mod.offDefine(nodeId, onDefine);
      mod.offDelete(nodeId, onDelete);
      mod.offError(nodeId, onError);
    };
  }, [mod, nodeId]);

  // listen to the cell events
  useEffect(() => {
    const onFulfill = (cell: Cell) => {
      // console.log("fulfilled", cell.uniqId, cell.name, cell.result, cell);
      setCell(cell);
      updateResult(cell.result);
      setError("");
      setPending(false);
    };

    const onPending = (cell: Cell) => {
      // console.log("pending", cell.name);
      setPending(true);
      setCell(cell);
    };

    const onReject = (cell: Cell) => {
      // console.log("rejected", cell.name, cell.error);
      setCell(cell);
      setError(cell.error.toString());
      updateResult(null);
      setPending(false);
    };

    mod.onFulfilled(nodeId, onFulfill);
    mod.onPending(nodeId, onPending);
    mod.onRejected(nodeId, onReject);
    return () => {
      mod.offFulfilled(nodeId, onFulfill);
      mod.offPending(nodeId, onPending);
      mod.offRejected(nodeId, onReject);
    };
  }, [cell, mod, nodeId]);

  console.log("cell result", cell, cell?.result, result, error);

  return (
    <div className={"carbon-cell-view"}>
      <div
        className={"carbon-cell-handle"}
        onClick={onToggle}
        onMouseDown={preventAndStop}
        data-focused={isFocused}
      >
        <div className={"cell-view-handle"}>
          <HiDotsVertical />
          {/*{isCollapsed ? <PiEyeClosed /> : <CgEye />}*/}
        </div>
      </div>
      <div className={"cell-result"}>
        <div className={"cell-loading"} data-loading={pending} />
        {!error &&
          cell?.codeType === "css" &&
          result !== NOT_LOADED &&
          isStyleElement(result) && (
            <div className={"cell-view-css"}>
              <ObjectViewer data={"<style>"} />
            </div>
          )}

        {/*show hidden script */}
        {!error &&
          cell?.codeType === "html" &&
          result !== NOT_LOADED &&
          isScriptElement(result) && (
            <div className={"cell-view-html"}>
              <ObjectViewer data={`<script>`} />
            </div>
          )}

        {!error &&
          cell?.codeType === "html" &&
          result !== NOT_LOADED &&
          isStyleElement(result) && (
            <div className={"cell-view-html"}>
              <ObjectViewer data={`<style>`} />
            </div>
          )}

        {!!error && <div className={"cell-view-error"}>{error}</div>}
        {cell && !error && result !== NOT_LOADED && (
          <div className={"cell-view-result"}>
            <ResultView
              cell={cell}
              cellName={cellName}
              result={result}
              node={node}
              html={html}
            />
          </div>
        )}
      </div>
    </div>
  );
};
export const Result = memo(ResultInner, (prev, next) => {
  return prev.node.eq(next.node) && prev.onToggle === next.onToggle;
});

const ResultView = (props) => {
  const { cell, cellName, result, node, html } = props;
  const ref = useRef<HTMLDivElement>();

  useEffect(() => {
    if (isHtmlElement(result)) {
      if (ref.current) {
        const el = ref.current;
        // if (html && el.children.length === 0) {
        //   console.log("html", html);
        //   return;
        // }
        if (el.hasChildNodes()) {
          el.removeChild(el.firstChild!);
        }
        el.appendChild(result);
      }
    }
  }, [html, ref, result]);

  // console.dir(result);

  if (result === true) {
    return (
      <CellResultView
        cell={cell}
        name={cellName}
        result={"true"}
        color={"#00b894"}
      />
    );
  }

  if (result === false) {
    return (
      <CellResultView
        cell={cell}
        name={cellName}
        result={"false"}
        color={"#f45a80"}
      />
    );
  }

  if (result === null) {
    return (
      <CellResultView
        cell={cell}
        name={cellName}
        result={"null"}
        color={"#f45a80"}
      />
    );
  }

  if (result === undefined) {
    return (
      <CellResultView
        cell={cell}
        name={cellName}
        result={"undefined"}
        color={"#f45a80"}
      />
    );
  }

  if (isNumber(result)) {
    return <CellResultView cell={cell} name={cellName} result={result} />;
  }

  if (isString(result)) {
    console.log("string", result);
    return <div>{result}</div>;
  }

  if (isArray(result)) {
    const res = result.map((r) => r.toString()).join(", ");
    return <CellResultView cell={cell} name={cellName} result={`[${res}]`} />;
  }

  if (isFunction(result)) {
    console.log("function", cell);
    return (
      <div className={"cell-result-name-view"}>
        {cell.hasName() && <div>{cell.name} = </div>}
        <ObjectViewer data={result} />
      </div>
    );
  }

  if (!isHtmlElement(result) && isObject(result)) {
    return (
      <div className={"cell-result-object"}>
        <ObjectViewer data={result} />
      </div>
    );
  }

  return (
    <div className={"cell-html-result"}>
      {cell?.hasName() && <div>{cellName} = </div>}
      <div
        // @ts-ignore
        ref={ref}
        key={node.id.toString()}
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }}
      />
    </div>
  );
};

const CellResultView = (props) => {
  const { cell, color } = props;

  return (
    <div className={"cell-result-name-view"} onKeyUp={stop} onKeyDown={stop}>
      {cell.hasName() && <div>{props.name} = </div>}
      <div style={{ color }}>{props.result}</div>
    </div>
  );
};
