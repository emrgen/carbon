import { RendererProps } from "@emrgen/carbon-react";
import { useNodeChange } from "@emrgen/carbon-react";
import { useState } from "react";
import { useRef } from "react";
import { useCallback } from "react";
import { memo } from "react";
import { useEffect } from "react";
import { useModule } from "../hooks/useModule";
import { isArray } from "lodash";
import { isFunction } from "lodash";
import { isNumber } from "lodash";
import { isString } from "lodash";
import { isObject } from "lodash";

const isHtmlElement = (res) => {
  return res instanceof HTMLElement;
};

const DOMPurify = createDOMPurify(window);

export const ViewComp = (props: RendererProps) => {
  const { node } = props;
  const mod = useModule();
  // const [result, setResult] = useState("");
  // const [rawHTML, setRawHTML] = useState("");
  // const [id, setId] = useState("");
  // const ref = useRef();
  //
  // useNodeChange(props);
  //
  // const updateResult = useCallback(
  //   (id, res) => {
  //     setId((old) => {
  //       if (old !== id) {
  //         return id;
  //       }
  //
  //       console.log("old", old);
  //       return old;
  //     });
  //     if (isFunction(res)) {
  //       setResult("Function");
  //     }
  //
  //     if (isArray(res)) {
  //       setResult(res.toString());
  //     }
  //
  //     if (isNumber(res)) {
  //       // setResult(res.toString());
  //     }
  //
  //     if (isString(res)) {
  //       setResult(res);
  //     }
  //
  //     if (isHtmlElement(res)) {
  //       if (ref.current) {
  //         // remove all children
  //         while (ref.current.firstChild) {
  //           ref.current.removeChild(ref.current.firstChild);
  //         }
  //         // ref.current.appendChild(res);
  //       }
  //       // setRawHTML(res);
  //     }
  //
  //     console.log(res);
  //   },
  //   [ref],
  // );
  //
  // useEffect(() => {
  //   const onFulfill = (id, parentId, result) => {
  //     console.log(id, result);
  //     updateResult(id, result);
  //   };
  //
  //   const key = `fulfilled:${node.parentId?.toString()}`;
  //   mod.on(key, onFulfill);
  //   return () => {
  //     mod.off(key, onFulfill);
  //   };
  // }, [mod, node.parentId, updateResult]);
  //
  // // check if the result was already calculated
  // useEffect(() => {
  //   const result = mod.results.get(node.parentId!);
  //   const id = mod.ids.get(node.parentId!);
  //   if (result !== undefined) {
  //     updateResult(id, result);
  //   }
  // }, [mod, node.parentId, updateResult]);
  //
  // console.log(result);

  return (
    <>
      <div className={"cell-view"} data-name={"cellView"}>
        <ResultMemo node={node} />
        {/*{id ? `${id} = ` : ""}*/}
        {/*{result}*/}
        {/*<div ref={ref} />*/}
      </div>
    </>
  );
};

const parseResult = (res, before?) => {
  if (isFunction(res)) {
    return "Function";
  }

  if (isArray(res)) {
    return res.toString();
  }

  if (isNumber(res)) {
    return res.toString();
  }

  if (isString(res)) {
    return res;
  }

  if (isHtmlElement(res)) {
    console.log(res);
    return "HTML Element";
  }

  return "";
};

const Result = (props) => {
  const { node } = props;
  const mod = useModule();

  const [id, setId] = useState(mod.ids.get(node.parentId!) ?? "");
  const [result, setResult] = useState(
    parseResult(mod.results.get(node.parentId!) ?? ""),
  );
  const [parseNode, setParseNode] = useState(
    mod.nodes.get(node.parentId!) ?? "",
  );
  const [rawHTML, setRawHTML] = useState("");
  const ref = useRef<HTMLElement>();

  useNodeChange(props);

  const updateResult = useCallback(
    (id, res) => {
      setId(id);
      setResult((before) => parseResult(res, before));
      setParseNode(mod.nodes.get(node.parentId!) ?? "");

      // if (isHtmlElement(res)) {
      if (ref.current) {
        // remove all children
        while (ref.current?.firstChild) {
          ref.current.removeChild(ref.current.firstChild);
        }
        if (isHtmlElement(res)) {
          // if (!res.parentElement || res.parentElement === ref.current) {
          ref.current.appendChild(res);
          // } else {
          //   console.log("mounted html", res);
        }

        console.log(mod.module._runtime._variables);
        setResult("");
        // }
      }

      if (isObject(res)) {
        if (res.type === "ViewForm") {
          const input = res.form.querySelector("input");
          input.addEventListener("change", (e) => {
            console.log(e);
            setResult((v) => (v == "on" ? "off" : "on"));
          });
          console.log("ViewFormFound", res, input);
          setResult(input.value);
        }
      }
    },
    [mod, node, setResult],
  );

  useEffect(() => {
    const onFulfill = (id, parentId, result) => {
      updateResult(id, result);
    };

    const key = `fulfilled:${node.parentId?.toString()}`;
    mod.on(key, onFulfill);
    return () => {
      mod.off(key, onFulfill);
    };
  }, [mod, node.parentId, updateResult]);

  // check if the result was already calculated
  useEffect(() => {
    const result = mod.results.get(node.parentId!);
    const id = mod.ids.get(node.parentId!);
    if (result !== undefined) {
      updateResult(id, result);
    }
  }, [mod, node.parentId, updateResult]);

  return (
    <div>
      <div>
        {id ? `${id} = ` : ""}
        {result}
      </div>
      <div ref={ref}></div>
    </div>
  );
};

const ResultMemo = memo(Result);
