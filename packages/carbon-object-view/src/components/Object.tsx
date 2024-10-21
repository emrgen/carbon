import { useState } from "react";
import { NodeView } from "./Node";
import { NodeInitial } from "./NodeInitial";
import { BsFillCaretRightFill } from "react-icons/bs";
import { isPlainObject, sortBy } from "lodash";
import { ProtoView } from "./Proto";
import { isGetterProp } from "./utils";
import { isSetterProp } from "./utils";
import { isFunctionProp } from "./utils";
import { AiFillCaretDown } from "react-icons/ai";

export const ObjectView = ({ data, propName, parentProps = new Set() }) => {
  const [expanded, setExpanded] = useState(false);

  const props = sortBy(Object.getOwnPropertyNames(data));

  const descriptors = props.reduce((props, name) => {
    const descriptor = Object.getOwnPropertyDescriptor(data, name);
    let value = "";

    if (parentProps.has(name)) {
      value = "[circular]";
    }

    if (parentProps.has(name)) {
      value = "[circular]";
    }

    if (isGetterProp(descriptor)) {
      value = "[getter]";
    }

    if (isSetterProp(descriptor)) {
      value = "[setter]";
    }

    if (isFunctionProp(descriptor)) {
      value = "f()";
    }

    parentProps.add(name);

    return {
      ...props,
      [name]: value,
    };
  }, {});

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
          {expanded ? (
            <AiFillCaretDown />
          ) : (
            <BsFillCaretRightFill fontSize={"12px"} />
          )}
        </div>
        <span className={"cov-object-constructor"}>
          {data.constructor?.name}
        </span>
        <span className={"cov-left-brace"}>{"{"}</span>
      </div>

      {expanded && (
        <div className={"cov-object-content-expanded"}>
          {Object.keys(descriptors).map((key, index) => {
            return (
              <div key={index} className={"cov-object-element"}>
                <NodeView data={data[key]} propName={key} isIndex={false} />
              </div>
            );
          })}

          {!isPlainObject(data) && (
            <div className={"cov-object-element"}>
              {/*<span className={"cov-object-key"}>{"<prototype>"}:</span>*/}
              <ProtoView
                data={data}
                propName={"<prototype>"}
                parentProps={new Set(Object.getOwnPropertyNames(data))}
              />
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
