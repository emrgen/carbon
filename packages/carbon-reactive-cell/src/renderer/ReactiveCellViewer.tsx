import {stop} from "@emrgen/carbon-core";
import {ObjectViewer} from "@emrgen/carbon-object-view";
import {RendererProps} from "@emrgen/carbon-react";
import {Cell, UNDEFINED_VALUE, Variable} from "@emrgen/carbon-reactive";
import {cloneDeep, isFunction, isPlainObject} from "lodash";
import {useCallback, useEffect, useRef, useState} from "react";
import {createPortal} from "react-dom";
// import root from "react-shadow";
import {useReactiveRuntime} from "../hooks/useReactiveRuntime";
import {useReactiveVariable} from "../hooks/useReactiveVariable";
import {isHtmlElement} from "../x";

const NOT_LOADED = "__NOT_LOADED__";

const visibleName = (v: Variable) => {
  const hasName = !v.cell.builtin && Cell.hasName(v.cell);
  return hasName ? (v.cell.name ?? "") : "";
};

// ReactiveCellEditor component for editing cell content or results of the cell
export const ReactiveCellViewer = (props: RendererProps) => {
  const runtime = useReactiveRuntime();
  const {node} = props;
  const [result, setResult] = useState<any>(
    runtime.mod.variable(node.id.toString())?.value ?? UNDEFINED_VALUE,
  );
  const [name, setName] = useState<string>(() => {
    const v = runtime.mod.variable(node.id.toString());
    return v ? visibleName(v) : "";
  });
  const [error, setError] = useState<string>("");
  const [pending, setPending] = useState<boolean>(false);
  const ref = useRef<HTMLDivElement | null>(null);
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

  // mount html result from cell evaluation
  const mountResult = useCallback(
    (result: any) => {
      if (ref.current) {
        const el = ref.current;
        const isHtml = isHtmlElement(result);
        setIsHtml(isHtml);
        if (isHtml) {
          if (el.hasChildNodes()) {
            Array.from(el.children).forEach((child) => {
              child.remove();
            })
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

  const onFulfilled = useCallback((v: Variable) => {
    if (v.state.isDetached) return;
    // console.log("Cell fulfilled:", v.id.toString(), v.value);
    updateResult(v.value);
    const hasName = !v.cell.builtin && Cell.hasName(v.cell);
    setName(hasName ? (v.cell.name ?? "") : "");
  }, [updateResult])

  const onRejected = useCallback((v: Variable) => {
    // console.error("Cell rejected:", cell.id.toString(), cell.error);
    updateResult(null);
    setPending(false);
    setName("");
    setError((v.error ?? "").toString());
  }, [updateResult]);

  const onProcessing = useCallback((v: Variable) => {
    // console.log("Cell processing:", node.id.toString());
    setPending(true);
    setError("");
    setName("");
  }, [])

  useReactiveVariable({
    nodeId: node.id.toString(),
    onFulfilled,
    onRejected,
    onProcessing,
  });

  // console.log(isHtml, pending, result);

  return (
    <div
      className={"carbon-reactive-cell-viewer"}
      // onMouseMove={stop}
      onMouseDown={stop}
      onBeforeInput={stop}
    >
      {/*<root.div className={"reactive-cell-html-viewer-container"}>*/}
      <div className={"carbon-reactive-cell-viewer-content"}>
        {result === NOT_LOADED ? (
          <div className={"reactive-cell-loading"}></div>
        ) : error && !pending ? (
          <div className={"reactive-cell-error"}>{error}</div>
        ) : (
          <div className={"reactive-cell-result"}>
            {/*<ShadowDom>*/}
            <div
              className={"reactive-cell-html-viewer"}
              ref={ref}
              style={{visibility: isHtml ? "visible" : "hidden"}}
            />
            {/*</ShadowDom>*/}
            <CellViewer name={name} result={result} hide={isHtml}/>
          </div>
        )}
      </div>
    </div>
  );
};

const CellViewer = ({name = "x", result, hide}: { name?: string; result: any; hide }) => {
  if (hide) {
    return null;
  }

  if (result === UNDEFINED_VALUE) {
    return <div className={"cell-result-undefined"}></div>;
  }

  return (
    <div className={"cell-result-object"}>
      <ObjectViewer data={result} field={name} root={true}/>
    </div>
  );
};

const ShadowDom = ({children}) => {
  const hostRef = useRef<any>(null);
  const [shadowRoot, setShadowRoot] = useState(null);

  useEffect(() => {
    if (hostRef.current && !shadowRoot) {
      const shadow = hostRef.current.attachShadow({mode: "open"});
      setShadowRoot(shadow);
    }
  }, [shadowRoot]);

  return <div ref={hostRef}>{shadowRoot && createPortal(children, shadowRoot)}</div>;
};
