import { useState } from "react";
import { BsFillCaretRightFill } from "react-icons/bs";
import { isPlainObject, sortBy } from "lodash";
import { isEmpty } from "lodash";
import { NodeView } from "./Node";
import { isGetterProp } from "./utils";
import { isSetterProp } from "./utils";
import { isFunctionProp } from "./utils";
import { isLiteral } from "./utils";
import { AiFillCaretDown } from "react-icons/ai";
import { Literal } from "./Literal";

export const ProtoView = ({ data, propName, parentProps = new Set() }) => {
  const [expanded, setExpanded] = useState(false);

  // NOTE: proto is the __proto__ of the object and can have many fields overridden by child object
  // so the overwriting fields become undefined and causes Error: Cannot access derived fields of undefined
  const proto = Object.getPrototypeOf(data);
  if (isLiteral(proto)) {
    if (isEmpty(proto)) {
      return null;
    }
    return <Literal data={proto} propName={propName} isIndex={false} />;
  }

  const props = sortBy(Object.getOwnPropertyNames(proto));

  const descriptors = props.reduce((props, name) => {
    const descriptor = Object.getOwnPropertyDescriptor(proto, name);
    let value = "";

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

  console.log("$$$", proto.constructor?.name ?? "Object", parentProps);

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
          {proto.constructor?.name ?? "Object"}
        </span>
        <span className={"cov-left-brace"}>{"{"}</span>
      </div>
      {expanded && (
        <div className={"cov-object-content-expanded"}>
          {Object.keys(descriptors).map((key, index) => {
            return (
              <div key={index} className={"cov-object-element"}>
                <span className={"cov-object-key"}>{key}:</span>
                <NodeView
                  data={descriptors[key]}
                  propName={key}
                  isIndex={false}
                />
              </div>
            );
          })}
          {!isPlainObject(data.__proto__) && (
            <div className={"cov-object-element"}>
              {/*<span className={"cov-object-key"}>{"<prototype>"}:</span>*/}
              <ProtoView
                data={data.__proto__}
                parentProps={parentProps}
                propName={'"<prototype>"'}
              />
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
                <NodeView
                  data={descriptors[key]}
                  propName={""}
                  isIndex={false}
                />
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
