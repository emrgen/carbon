import { isArray } from "lodash";
import { isObject } from "lodash";
import { isFunction } from "lodash";
import { ArrayView } from "./Array";
import { ObjectView } from "./Object";
import { useMemo } from "react";
import { FunctionView } from "./Function";
import { isLiteral } from "./utils";
import { isGenerator } from "./utils";
import { Literal } from "./Literal";

export const NodeView = ({ data, propName, isIndex }) => {
  const view = useMemo(() => {
    if (isLiteral(data)) {
      return <Literal data={data} propName={propName} isIndex={false} />;
    }

    if (isFunction(data)) {
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
  }, [data, propName]);

  return <div className={"cov-node"}>{view}</div>;
};
