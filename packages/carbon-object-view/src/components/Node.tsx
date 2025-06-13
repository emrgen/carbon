import { isArray, isFunction, isObject } from "lodash";
import { useMemo } from "react";
import { ArrayView } from "./Array";
import { FunctionView } from "./Function";
import { Literal } from "./Literal";
import { ObjectView } from "./Object";
import { isAsyncFunction, isGenerator, isLiteral, isProxy } from "./utils";

// NodeView renders js types for in UI type visualization
export const NodeView = ({ data, propName, isIndex, root }) => {
  const view = useMemo(() => {
    if (isLiteral(data)) {
      return <Literal data={data} propName={propName} isIndex={false} root={root} />;
    }

    if (isProxy(data)) {
      return <Literal data={"[Proxy]"} propName={propName} isIndex={false} root={root} />;
    }

    if (isGenerator(data)) {
      return <Literal data={"f*()"} propName={propName} isIndex={false} root={root} />;
    }

    if (!isProxy(data) && isFunction(data)) {
      return (
        <FunctionView
          data={data}
          isIndex={isIndex}
          propName={propName}
          isGenerator={isGenerator(data)}
          isAsync={isAsyncFunction(data)}
          root={root}
        />
      );
    }

    if (isArray(data)) {
      return <ArrayView data={data} propName={propName} root={root} />;
    }

    if (isObject(data)) {
      return <ObjectView data={data} propName={propName} root={root} />;
    }

    return JSON.stringify(data, null, 2);
  }, [data, isIndex, propName, root]);

  return <div className={"cov-node"}>{view}</div>;
};
