import { useMemo } from "react";
import { isArray } from "lodash";
import { isObject } from "lodash";
import { isFunction } from "lodash";
import { FunctionView } from "./Function";
import { isLiteral } from "./utils";
import { isGenerator } from "./utils";
import { isProxy } from "./utils";
import { Literal } from "./Literal";

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
      return (
        <span className={"cov-boolean-" + data.toString()}>
          {data.toString()}
        </span>
      );
    }

    if (isArray(data)) {
      return (
        <Literal
          data={`Array(${data.length})`}
          propName={propName}
          isIndex={isIndex}
        />
      );
    }

    if (isObject(data)) {
      return (
        <Literal
          data={data.constructor?.name}
          propName={propName}
          isIndex={isIndex}
        />
      );
    }

    return <span>FAILED!</span>;
  }, [data, isIndex, propName]);
};
