import { useState } from "react";
import { NodeView } from "./Node";
import { NodeInitial } from "./NodeInitial";
import { BsFillCaretRightFill } from "react-icons/bs";
import { isPlainObject } from "lodash";
import { ProtoView } from "./Proto";

export const ObjectView = ({ data, propName }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={"cov-object"}
      style={{ display: expanded ? "block" : "flex" }}
    >
      <div
        className={"cov-object-initial"}
        onClick={() => setExpanded((e) => !e)}
      >
        {propName && <span className={"cov-object-key"}>{propName}:</span>}
        <div className={"cov-expander"}>
          <BsFillCaretRightFill fontSize={"12px"} />
        </div>
        <span className={"cov-object-constructor"}>
          {data.constructor?.name}
        </span>
        <span className={"cov-left-brace"}>{"{"}</span>
      </div>

      {expanded && (
        <div className={"cov-object-content-expanded"}>
          {Object.keys(data).map((key, index) => {
            return (
              <div key={index} className={"cov-object-element"}>
                <NodeView data={data[key]} propName={key} isIndex={false} />
              </div>
            );
          })}
          {!isPlainObject(data) && (
            <div className={"cov-object-element"}>
              <span className={"cov-object-key"}>{"<prototype>"}:</span>
              <ProtoView data={data} />
            </div>
          )}
        </div>
      )}

      {!expanded && (
        <div className={"cov-object-content-collapsed"}>
          {Object.keys(data).map((key, index) => {
            return (
              <div key={index} className={"cov-object-element"}>
                {/*<span className={"cov-object-key"}>{key}:</span>*/}
                <NodeInitial data={data[key]} propName={key} isIndex={false} />
                {index + 1 !== Object.keys(data).length && (
                  <span className={"cov-comma"}>,</span>
                )}
              </div>
            );
          })}
        </div>
      )}
      <span className={"cov-right-brace"}>{"}"}</span>
    </div>
  );
};
