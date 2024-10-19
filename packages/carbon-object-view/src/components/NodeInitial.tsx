import { useMemo } from "react";
import { isArray } from "lodash";
import { isObject } from "lodash";
import { isNumber } from "lodash";
import { isString } from "lodash";
import { isSymbol } from "lodash";
import { isFunction } from "lodash";
import { FunctionView } from "./Function";

export const NodeInitial = ({ data }) => {
  return useMemo(() => {
    if (isNumber(data)) {
      return <span className={"cov-number"}>{data}</span>;
    }

    if (isString(data)) {
      return <span className={"cov-string"}>{data}</span>;
    }

    if (isSymbol(data)) {
      return <span className={"cov-symbol"}>{data.toString()}</span>;
    }

    if (data === null) {
      return <span className={"cov-null"}>null</span>;
    }

    if (data === undefined) {
      return <span className={"cov-undefined"}>undefined</span>;
    }

    if (isFunction(data)) {
      return <FunctionView data={data} />;
    }

    if (data === true || data === false) {
      return (
        <span className={"cov-boolean-" + data.toString()}>
          {data.toString()}
        </span>
      );
    }

    if (isArray(data)) {
      return <span>Array({data.length})</span>;
    }

    if (isObject(data)) {
      return <span>{data.constructor.name}</span>;
    }

    return <span>FAILED!</span>;
  }, [data]);
};
