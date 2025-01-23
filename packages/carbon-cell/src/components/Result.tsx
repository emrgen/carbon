import { HasFocusPath } from "@emrgen/carbon-core";
import { ObjectViewer } from "@emrgen/carbon-object-view";
import { Optional } from "@emrgen/types";
import createDOMPurify from "dompurify";
import {
  cloneDeep,
  isArray,
  isFunction,
  isNumber,
  isObject,
  isPlainObject,
  isString,
} from "lodash";
import { memo, ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { ViewStylePath } from "../constants";
import { ActiveCell } from "../core/ActiveCellRuntime";
import { useActiveCellRuntime } from "../hooks/useActiveCellRuntime";
import { isHtmlElement, isScriptElement, isStyleElement } from "../utils";

const DOMPurify = createDOMPurify(window);

const NOT_LOADED = "__NOT_LOADED__";

const ResultInner = (props) => {
  const { onToggle, node } = props;

  const mod = useActiveCellRuntime();

  const [nodeId] = useState(node.id.toString());
  const [cell, setCell] = useState<Optional<ActiveCell>>(
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
      if (isPlainObject(res)) {
        setResult(cloneDeep(res));
      } else {
        setResult(res);
      }
    }
  };

  // listen to the cell events from the module
  useEffect(() => {
    const onDefine = (cell: ActiveCell) => {
      console.log("redefined", cell);
      setError("");
      setCell(cell);
      setCellName(cell.name);
      setPending(false);
    };

    const onDelete = (cell: ActiveCell) => {
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
    const onFulfill = (cell: ActiveCell) => {
      console.log(
        `CELL: evaluated. ID: ${cell.uniqId}, Name: ${cell.name}, Result:`,
        cell.result,
        cell,
      );
      setCell(cell);
      updateResult(cell.result);
      setError("");
      setPending(false);
    };

    const onPending = (cell: ActiveCell) => {
      // console.log("pending", cell.name);
      setPending(true);
      setCell(cell);
    };

    const onReject = (cell: ActiveCell) => {
      console.log("rejected", cell.name, cell.error);
      setCell(cell);
      setError(cell.error.toString());
      console.log(`CELL: failed. ID: ${cell.uniqId}, Name: ${cell.name}`);
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

  // console.log("cell result", cell, cell?.result, result, error);

  return (
    <div className={"carbon-cell-view"}>
      {/*<div*/}
      {/*  className={"carbon-cell-handle"}*/}
      {/*  onClick={onToggle}*/}
      {/*  onMouseDown={preventAndStop}*/}
      {/*  data-focused={isFocused}*/}
      {/*>*/}
      {/*  <div className={"cell-view-handle"}>*/}
      {/*    <HiDotsVertical />*/}
      {/*    /!*{isCollapsed ? <PiEyeClosed /> : <CgEye />}*!/*/}
      {/*  </div>*/}
      {/*</div>*/}
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
        // if (
        //   result.parentNode &&
        //   !getClassNames(result.parentNode).includes(node.id.toString())
        // ) {
        //   return;
        // }
        const el = ref.current;
        // if (html && el.children.length === 0) {
        //   console.log("html", html);
        //   return;
        // }

        // result.setAttribute("style", node.props.get(ViewStylePath, {}));
        if (el.hasChildNodes()) {
          el.removeChild(el.firstChild!);
        }
        el.appendChild(result);
      }
    }
  }, [html, node, ref, result]);

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
    return <div>{result}</div>;
  }

  if (
    cellName &&
    (isArray(result) || isObject(result) || isFunction(result)) &&
    !isHtmlElement(result)
  ) {
    return (
      <CellResultView
        cell={cell}
        name={cellName}
        result={<ObjectViewer data={result} />}
      />
    );

    // return <CellResultView cell={cell} name={cellName} result={`[${res}]`} />;
  }

  // if (isFunction(result)) {
  //   return (
  //     <div className={"cell-result-name-view"}>
  //       {cell.hasName() && <div>{cell.name} = </div>}
  //       <ObjectViewer data={result} />
  //     </div>
  //   );
  // }
  //
  if (!isHtmlElement(result) && isObject(result)) {
    return (
      <div className={"cell-result-object"}>
        <ObjectViewer data={result} />
      </div>
    );
  }

  // console.log(node.id.toString(), result, result.parentNode);

  // if (
  //   isHtmlElement(result) &&
  //   !getClassNames(result.parentNode).includes(node.id.toString())
  // ) {
  //   console.log(getClassNames(result), node.id.toString());
  //   return (
  //     <div className={"cell-result-object"}>
  //       <ObjectViewer data={result} />
  //     </div>
  //   );
  // }

  return (
    <div className={"cell-html-result"}>
      {cell?.hasName() && <div>{cellName} = </div>}
      <div
        style={node.props.get(ViewStylePath, {})}
        // @ts-ignore
        ref={ref}
        className={node.id.toString()}
        key={node.id.toString()}
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }}
      />
    </div>
  );
};

interface CellResultViewProps {
  cell: ActiveCell;
  color?: string;
  name: string;
  result: ReactNode;
}

// CellResultView renders the js type along with cell variable name
const CellResultView = (props: CellResultViewProps) => {
  const { cell, color, name, result } = props;

  return (
    <div className={"cell-result-named-view"} onKeyUp={stop} onKeyDown={stop}>
      {cell.hasName() && name && (
        <div className={"cell-result-cell-name"}>{name} =&nbsp;</div>
      )}
      <div style={{ color }} className={"cell-result-view-wrapper"}>
        {result}
      </div>
    </div>
  );
};

const getClassNames = (el) => {
  if (!el) return [];
  return el.getAttribute("class").split(" ");
};
