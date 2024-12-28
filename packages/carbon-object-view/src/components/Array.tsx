import { useState } from "react";
import { BsFillCaretRightFill } from "react-icons/bs";
import { NodeView } from "./Node";
import { NodeInitial } from "./NodeInitial";

interface ArrayProps {
  propName: string;
  data: Array<any>;
}

// ArrayView renders a view of collapsible array with elements
// renders Array as following
// > Array(4) [1,2,3,4]
export const ArrayView = (props: ArrayProps) => {
  const { data, propName } = props;
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={"cov-array"}
      style={{
        display: "flex",
        flexDirection: expanded ? "column" : "row",
      }}
    >
      <div
        className={"cov-array-initial"}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setExpanded((e) => !e);
        }}
      >
        {propName && <span className={"cov-object-key"}>{propName}:</span>}
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
                  <NodeView data={d} propName={`${index}`} isIndex={true} />
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
                  <NodeInitial data={d} propName={""} isIndex={false} />
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
