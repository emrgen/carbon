import { isArray } from "lodash";
import { isObject } from "lodash";
import { isNumber } from "lodash";
import { isString } from "lodash";
import { isSymbol } from "lodash";
import { isFunction } from "lodash";
import { ArrayView } from "./Array";
import { ObjectView } from "./Object";
import { useMemo } from "react";
import { FunctionView } from "./Function";

export const NodeView = ({ data }) => {
  const view = useMemo(() => {
    if (isNumber(data)) {
      return <span className={"cov-number"}>{data}</span>;
    }

    if (isString(data)) {
      return <span className={"cov-string"}>{data}</span>;
    }

    if (isSymbol(data)) {
      return <span className={"cov-symbol"}>{data.toString()}</span>;
    }

    if (isFunction(data)) {
      return <FunctionView data={data} />;
    }

    if (data === null) {
      return <span className={"cov-null"}>null</span>;
    }

    if (data === undefined) {
      return <span className={"cov-undefined"}>undefined</span>;
    }

    if (data === true || data === false) {
      return (
        <span className={"cov-boolean-" + data.toString()}>
          {data.toString()}
        </span>
      );
    }

    if (isArray(data)) {
      return <ArrayView data={data} />;
    }

    if (isObject(data)) {
      return <ObjectView data={data} />;
    }

    return JSON.stringify(data, null, 2);
  }, [data]);

  return <div className={"cov-node"}>{view}</div>;
};
