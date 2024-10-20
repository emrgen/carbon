import { useState } from "react";
import { NodeView } from "./Node";
import { BsFillCaretRightFill } from "react-icons/bs";
import { NodeInitial } from "./NodeInitial";

interface ArrayProps {
  data: Array<any>;
}

export const ArrayView = (props) => {
  const { data } = props;
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={"cov-array"}
      style={{ display: expanded ? "block" : "flex" }}
    >
      <div
        className={"cov-array-initial"}
        onClick={() => setExpanded((e) => !e)}
      >
        <div className={"cov-expander"}>
          <BsFillCaretRightFill fontSize={"12px"} />
        </div>
        <span className={"cov-object-constructor"}>Array({data.length})</span>
        <span className={"cov-left-bracket"}>[</span>
      </div>

      {expanded && (
        <>
          <div className={"cov-array-content-expanded"}>
            {data.map((d, index) => {
              return (
                <div key={index} className={"cov-array-element"}>
                  <NodeView data={d} propName={index} isIndex={true} />
                </div>
              );
            })}
          </div>
          <span className={"cov-right-bracket"}>]</span>
        </>
      )}

      {!expanded && (
        <div className={"cov-array-content-collapsed"}>
          {
            // Show the first 3 elements
            data.map((d, index) => {
              return (
                <div key={index} className={"cov-array-element"}>
                  <NodeInitial data={d} />
                  {index + 1 !== data.length && (
                    <span className={"cov-comma"}>,</span>
                  )}
                </div>
              );
            })
          }
          <span className={"cov-right-bracket"}>]</span>
        </div>
      )}
    </div>
  );
};
