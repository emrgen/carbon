import { isNumber } from "lodash";
import { isString } from "lodash";
import { isSymbol } from "lodash";
import { useMemo } from "react";

export const Literal = ({ data, propName, isIndex }) => {
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
  }, [data]);

  const keyClass = isIndex ? "cov-array-key" : "cov-object-key";

  return (
    <div className={"cov-literal"}>
      {propName && <span className={keyClass}>{propName}:</span>}
      <span className={"cov-literal-value"}>{view}</span>
    </div>
  );
};
