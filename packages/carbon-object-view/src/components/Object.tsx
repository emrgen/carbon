import { isPlainObject } from "lodash";
import { useCallback, useEffect, useState } from "react";
import { AiFillCaretDown } from "react-icons/ai";
import { BsFillCaretRightFill } from "react-icons/bs";
import { NodeView } from "./Node";
import { NodeInitial } from "./NodeInitial";
import { ProtoView } from "./Proto";
import { isFunctionProp, isGetterProp, isSetterProp, PAGE_SIZE } from "./utils";

export const ObjectView = ({ data, propName, root }) => {
  const [expanded, setExpanded] = useState(false);

  const [descriptors, setDescriptors] = useState({});
  const [propKeys, setPropKeys] = useState<string[]>([]);
  const [slice, setSlice] = useState<string[]>([]);
  const [showMore, setShowMore] = useState(propKeys.length > PAGE_SIZE);
  const [page, setPage] = useState(1);
  const [parentProps, setParentProps] = useState(new Set<string>());

  useEffect(() => {
    // Get the properties of the object
    const props = Object.getOwnPropertyNames(data);

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

    setDescriptors(descriptors);
    setPropKeys(Object.keys(descriptors));
  }, [data, parentProps]);

  const handleShowMore = useCallback(() => {
    const newPage = page + 1;
    const newSlice = propKeys.slice(0, newPage * PAGE_SIZE);
    setSlice(newSlice);
    setPage(newPage);
    setShowMore(newSlice.length < propKeys.length);
  }, [page, propKeys]);

  useEffect(() => {
    if (propKeys.length <= PAGE_SIZE) {
      setSlice(propKeys);
      setShowMore(false);
    } else {
      setSlice(propKeys.slice(0, PAGE_SIZE));
      setShowMore(true);
    }
    setPage(1);
  }, [propKeys]);

  return (
    <div className={"cov-object"} style={{ display: expanded ? "block" : "flex" }}>
      <div
        className={"cov-object-initial"}
        onClick={(e) => {
          e.preventDefault();
          setExpanded((e) => !e);
        }}
      >
        {!root && propName && <span className={"cov-object-key"}>{propName} = </span>}
        {root && propName && (
          <span className={"cov-object-key"} id={"cov-root-name"}>
            {propName} ={" "}
          </span>
        )}
        <div className={"cov-expander"}>
          {expanded ? <AiFillCaretDown /> : <BsFillCaretRightFill fontSize={"12px"} />}
        </div>
        <span className={"cov-object-constructor"}>{data.constructor?.name}</span>
        <span className={"cov-left-brace"}>{"{"}</span>
      </div>

      {expanded && (
        <div className={"cov-object-content-expanded"}>
          {slice.map((key, index) => {
            return (
              <div key={index} className={"cov-object-element"}>
                <NodeView data={data[key]} propName={key} isIndex={false} root={false} />
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
          {slice.map((key, index) => {
            return (
              <div key={index} className={"cov-object-element"}>
                {/*<span className={"cov-object-key"}>{key}:</span>*/}
                <NodeInitial data={data[key]} propName={key} isIndex={false} />
                {index + 1 !== Object.keys(data).length && <span className={"cov-comma"}>,</span>}
              </div>
            );
          })}
        </div>
      )}
      {expanded && showMore && (
        <div className={"cov-show-more cov-show-more__object-fields"} onClick={handleShowMore}>
          ...more
        </div>
      )}
      <span className={"cov-right-brace"}>{"}"}</span>
    </div>
  );
};
