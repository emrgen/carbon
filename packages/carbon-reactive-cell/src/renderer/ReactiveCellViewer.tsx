import { stop } from "@emrgen/carbon-core";
import { ObjectViewer } from "@emrgen/carbon-object-view";
import { RendererProps } from "@emrgen/carbon-react";
import { Cell, UNDEFINED_VALUE, Variable } from "@emrgen/carbon-reactive";
import { cloneDeep, isFunction, isPlainObject } from "lodash";
import { useCallback, useRef, useState } from "react";
import { useReactiveRuntime } from "../hooks/useReactiveRuntime";
import { useReactiveVariable } from "../hooks/useReactiveVariable";
import { isHtmlElement } from "../x";

const NOT_LOADED = "__NOT_LOADED__";

const visibleName = (v: Variable) => {
  const hasName = !v.cell.builtin && Cell.hasName(v.cell);
  return hasName ? (v.cell.name ?? "") : "";
};

// ReactiveCellEditor component for editing cell content or results of the cell
export const ReactiveCellViewer = (props: RendererProps) => {
  const runtime = useReactiveRuntime();
  const { node } = props;
  const [result, setResult] = useState<any>(
    runtime.mod.variable(node.id.toString())?.value ?? UNDEFINED_VALUE,
  );
  const [name, setName] = useState<string>(() => {
    const v = runtime.mod.variable(node.id.toString());
    return v ? visibleName(v) : "";
  });
  const [error, setError] = useState<string>("");
  const [pending, setPending] = useState<boolean>(false);
  const ref = useRef<any>(null);
  const [isHtml, setIsHtml] = useState<boolean>(false);

  // attach result to the ref when the component mounts
  // NOTE: use shadow dom here for safety
  // useEffect(() => {
  //   if (ref.current) {
  //     const el = ref.current;
  //     if (isHtmlElement(result)) {
  //       if (el.hasChildNodes()) {
  //         el.removeChild(el.firstChild!);
  //       }
  //       el.appendChild(result);
  //     } else {
  //       // if the result is not an HTML element, we clear the ref
  //       if (el.hasChildNodes()) {
  //         el.removeChild(el.firstChild!);
  //       }
  //     }
  //   }
  // }, [node, ref, result]);

  const mountResult = useCallback(
    (result: any) => {
      if (ref.current) {
        const el = ref.current;
        const isHtml = isHtmlElement(result);
        setIsHtml(isHtml);
        if (isHtml) {
          if (el.hasChildNodes()) {
            el.removeChild(el.firstChild!);
          }
          el.appendChild(result);
        } else {
          // if the result is not an HTML element, we clear the ref
          if (el.hasChildNodes()) {
            el.removeChild(el.firstChild!);
          }
          setResult(result);
        }
      }
    },
    [ref],
  );

  const updateResult = useCallback(
    (res: any) => {
      setError("");
      if (isFunction(res)) {
        mountResult(() => res);
      } else {
        if (isPlainObject(res)) {
          mountResult(cloneDeep(res));
        } else {
          mountResult(res);
        }
      }
    },
    [mountResult],
  );

  useReactiveVariable({
    node,
    onFulfilled: (v) => {
      console.log("Cell fulfilled:", v.id.toString(), v.value);
      updateResult(v.value);
      const hasName = !v.cell.builtin && Cell.hasName(v.cell);
      setName(hasName ? (v.cell.name ?? "") : "");
    },
    onRejected: (cell) => {
      // console.error("Cell rejected:", cell.id.toString(), cell.error);
      updateResult(null);
      setPending(false);
      setName("");
      setError((cell.error ?? "").toString());
    },
    onProcessing: () => {
      // console.log("Cell processing:", node.id.toString());
      setPending(true);
      setError("");
      setName("");
    },
  });

  // console.log(isHtml, pending, result);

  return (
    <div
      className={"carbon-reactive-cell-viewer"}
      // onMouseMove={pause}
      // onMouseUp={pause}
      onBeforeInput={stop}
    >
      <div className={"carbon-reactive-cell-viewer-content"}>
        {result === NOT_LOADED ? (
          <div className={"reactive-cell-loading"}></div>
        ) : error && !pending ? (
          <div className={"reactive-cell-error"}>{error}</div>
        ) : (
          <div className={"reactive-cell-result"}>
            <div
              className={"reactive-cell-html-viewer"}
              ref={ref}
              style={{ visibility: isHtml ? "visible" : "hidden" }}
            />
            <CellViewer name={name} result={result} hide={isHtml} />
          </div>
        )}
      </div>
    </div>
  );
};

const CellViewer = ({ name = "x", result, hide }: { name?: string; result: any; hide }) => {
  if (hide) {
    return null;
  }

  if (result === UNDEFINED_VALUE) {
    return <div className={"cell-result-undefined"}></div>;
  }

  return (
    <div className={"cell-result-object"}>
      <ObjectViewer data={result} field={name} root={true} />
    </div>
  );
};
