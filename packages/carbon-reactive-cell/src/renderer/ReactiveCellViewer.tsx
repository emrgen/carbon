import { RendererProps } from "@emrgen/carbon-react";
import { cloneDeep, isFunction, isPlainObject } from "lodash";
import { useCallback, useState } from "react";
import { useReactiveVariable } from "../hooks/useReactiveVariable";

const NOT_LOADED = "__NOT_LOADED__";

// ReactiveCellEditor component for editing cell content or results of the cell
export const ReactiveCellViewer = (props: RendererProps) => {
  const { node } = props;
  const [result, setResult] = useState<any>(NOT_LOADED);
  const [error, setError] = useState<string>("");

  const updateResult = useCallback((res) => {
    if (isFunction(res)) {
      setResult(() => res);
    } else {
      if (isPlainObject(res)) {
        setResult(cloneDeep(res));
      } else {
        setResult(res);
      }
    }

    setError("");
  }, []);

  useReactiveVariable({
    node,
    onFulfilled: (cell) => {
      console.log("Cell fulfilled:", cell.id.toString(), cell.value);
      updateResult(cell.value);
    },
    onRejected: (cell) => {
      console.error("Cell rejected:", cell.id.toString(), cell.error);
      updateResult(null);
      setError((cell.error ?? "").toString());
    },
  });

  return (
    <div className={"carbon-reactive-cell-viewer"}>
      <div className={"carbon-reactive-cell-viewer-content"}>
        {result === NOT_LOADED ? (
          <div className={"reactive-cell-loading"}>Loading...</div>
        ) : error ? (
          <div className={"reactive-cell-error"}>{error}</div>
        ) : (
          <div className={"reactive-cell-result"}>
            <CellViewer result={result} />
          </div>
        )}
      </div>
    </div>
  );
};

const CellViewer = ({ result }: { result: any }) => {
  if (typeof result === "string") {
    return <pre>{result}</pre>;
  } else if (typeof result === "object") {
    return <pre>{JSON.stringify(result, null, 2)}</pre>;
  } else {
    return <span>{String(result)}</span>;
  }
};
