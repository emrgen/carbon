import { useMemo } from "react";
import { isArray } from "lodash";
import { isObject } from "lodash";
import { isFunction } from "lodash";
import { FunctionView } from "./Function";
import { isLiteral } from "./utils";
import { isGenerator } from "./utils";
import { Literal } from "./Literal";

export const NodeInitial = ({ data, propName, isIndex }) => {
  return useMemo(() => {
    if (isLiteral(data)) {
      return <Literal data={data} propName={propName} isIndex={isIndex} />;
    }

    if (isGenerator(data)) {
      return <span>Generator</span>;
    }

    if (isFunction(data)) {
      return (
        <FunctionView
          data={data}
          propName={propName}
          isIndex={isIndex}
          isGenerator={isGenerator(data)}
        />
      );
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
      return <span>{data.constructor?.name}</span>;
    }

    return <span>FAILED!</span>;
  }, [data]);
};
