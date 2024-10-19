import { NodeView } from "./Node";
import { useState } from "react";
import { BsFillCaretRightFill } from "react-icons/bs";
import { isPlainObject } from "lodash";

const isGetter = (descriptor) => {
  return "get" in descriptor;
};

const isSetter = (descriptor) => {
  return "set" in descriptor;
};

const isAccessor = (descriptor) => {
  return isGetter(descriptor) || isSetter(descriptor);
};

const isFunction = (descriptor) => {
  return "value" in descriptor && typeof descriptor.value === "function";
};

export const ProtoView = ({ data }) => {
  const [expanded, setExpanded] = useState(false);
  const proto = Object.getPrototypeOf(data);
  const props = Object.getOwnPropertyNames(proto);

  const descriptors = props.reduce((props, name) => {
    const descriptor = Object.getOwnPropertyDescriptor(proto, name);
    let value = "";
    if (isGetter(descriptor)) {
      value = "[getter]";
    }

    if (isSetter(descriptor)) {
      value = "[setter]";
    }

    if (isFunction(descriptor)) {
      value = "f()";
    }

    return {
      ...props,
      [name]: value,
    };
  }, {});

  console.log(descriptors);

  // descriptors.__proto__ = Object.getPrototypeOf(proto);

  console.log(descriptors["x"]);

  console.log(proto);
  return (
    <div
      className={"cov-object"}
      style={{ display: expanded ? "block" : "flex" }}
    >
      <div
        className={"cov-object-initial"}
        onClick={() => setExpanded((e) => !e)}
      >
        <div className={"cov-expander"}>
          <BsFillCaretRightFill fontSize={"12px"} />
        </div>
        <span className={"cov-object-constructor"}>{"Object"}</span>
        <span className={"cov-left-brace"}>{"{"}</span>
      </div>
      {expanded && (
        <div className={"cov-object-content-expanded"}>
          {Object.keys(descriptors).map((key, index) => {
            return (
              <div key={index} className={"cov-object-element"}>
                <span className={"cov-object-key"}>{key}:</span>
                <NodeView data={descriptors[key]} />
              </div>
            );
          })}
          {!isPlainObject(data.__proto__) && (
            <div className={"cov-object-element"}>
              <span className={"cov-object-key"}>{"<prototype>"}:</span>
              <ProtoView data={data.__proto__} />
            </div>
          )}
        </div>
      )}
      {!expanded && (
        <div className={"cov-object-content-collapsed"}>
          {Object.keys(descriptors).map((key, index) => {
            return (
              <div key={index} className={"cov-object-element"}>
                <span className={"cov-object-key"}>{key}:</span>
                <NodeView data={descriptors[key]} />
                {index + 1 !== Object.keys(descriptors).length && (
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
