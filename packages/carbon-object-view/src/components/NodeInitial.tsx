import { isArray, isFunction, isObject } from "lodash";
import { useMemo } from "react";
import { FunctionView } from "./Function";
import { Literal } from "./Literal";
import { isGenerator, isLiteral, isProxy } from "./utils";

export const NodeInitial = ({ data, propName, isIndex }) => {
  return useMemo(() => {
    if (isLiteral(data)) {
      return <Literal data={data} propName={propName} isIndex={isIndex} />;
    }

    if (isProxy(data)) {
      return <Literal data={"[Proxy]"} propName={propName} isIndex={false} />;
    }

    if (isGenerator(data)) {
      return <span>Generator</span>;
    }

    if (!isProxy(data) && isFunction(data)) {
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
      return <span className={"cov-boolean-" + data.toString()}>{data.toString()}</span>;
    }

    if (isArray(data)) {
      return <Literal data={`Array(${data.length})`} propName={propName} isIndex={isIndex} />;
    }

    if (isObject(data)) {
      return <Literal data={data.constructor?.name} propName={propName} isIndex={isIndex} />;
    }

    return <span>FAILED!</span>;
  }, [data, isIndex, propName]);
};
