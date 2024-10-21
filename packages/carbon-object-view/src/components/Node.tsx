import { isArray } from "lodash";
import { isObject } from "lodash";
import { isFunction } from "lodash";
import { ArrayView } from "./Array";
import { ObjectView } from "./Object";
import { useMemo } from "react";
import { FunctionView } from "./Function";
import { isLiteral } from "./utils";
import { isGenerator } from "./utils";
import { isProxy } from "./utils";
import { Literal } from "./Literal";

export const NodeView = ({ data, propName, isIndex }) => {
  const view = useMemo(() => {
    if (isLiteral(data)) {
      return <Literal data={data} propName={propName} isIndex={false} />;
    }

    if (isProxy(data)) {
      return <Literal data={"[Proxy]"} propName={propName} isIndex={false} />;
    }

    if (isGenerator(data)) {
      return <Literal data={"f*()"} propName={propName} isIndex={false} />;
    }

    if (!isProxy(data) && isFunction(data)) {
      return (
        <FunctionView
          data={data}
          isIndex={isIndex}
          propName={propName}
          isGenerator={isGenerator(data)}
        />
      );
    }

    if (isArray(data)) {
      return <ArrayView data={data} propName={propName} />;
    }

    if (isObject(data)) {
      return <ObjectView data={data} propName={propName} />;
    }

    return JSON.stringify(data, null, 2);
  }, [data, isIndex, propName]);

  return <div className={"cov-node"}>{view}</div>;
};
