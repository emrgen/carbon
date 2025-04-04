import { useCallback, useEffect, useState } from "react";
import { BsFillCaretRightFill } from "react-icons/bs";
import { NodeView } from "./Node";
import { NodeInitial } from "./NodeInitial";
import { PAGE_SIZE } from "./utils";

interface ArrayProps {
  propName: string;
  data: Array<any>;
  root?: boolean;
}

// ArrayView renders a view of collapsible array with elements
// renders Array as following
// > Array(4) [1,2,3,4]
export const ArrayView = (props: ArrayProps) => {
  const { data, propName, root } = props;
  const [expanded, setExpanded] = useState(false);

  const [slice, setSlice] = useState(data.slice(0, PAGE_SIZE));
  const [showMore, setShowMore] = useState(data.length > PAGE_SIZE);
  const [page, setPage] = useState(1);

  const handleShowMore = useCallback(() => {
    const newPage = page + 1;
    const newSlice = data.slice(0, newPage * 10);
    setSlice(newSlice);
    setPage(newPage);
    setShowMore(newSlice.length < data.length);
  }, [data, page]);

  useEffect(() => {
    if (data.length <= PAGE_SIZE) {
      setSlice(data);
      setShowMore(false);
    } else {
      setSlice(data.slice(0, PAGE_SIZE));
      setShowMore(true);
    }
    setPage(1);
  }, [data]);

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
        {!root && propName && <span className={"cov-object-key"}>{propName}:</span>}
        {root && propName && (
          <span className={"cov-object-key"} id={root ? "cov-root-name" : ""}>
            {propName} ={" "}
          </span>
        )}
        <div className={`cov-expander ${expanded ? "expanded" : "collapsed"}`}>
          <BsFillCaretRightFill fontSize={"12px"} />
        </div>
        <span className={"cov-object-constructor"}>Array({slice.length})</span>
        <span className={"cov-left-bracket"}>[</span>
      </div>

      {expanded && (
        <>
          <div className={"cov-array-content-expanded"}>
            {slice.map((d, index) => {
              return (
                <div key={index} className={"cov-array-element"}>
                  <NodeView data={d} propName={`${index}`} isIndex={true} root={false} />
                </div>
              );
            })}
          </div>
          {expanded && showMore && (
            <div className={"cov-show-more cov-show-more__array-items"} onClick={handleShowMore}>
              ...more
            </div>
          )}
          <span className={"cov-right-bracket"}>]</span>
        </>
      )}

      {!expanded && (
        <div className={"cov-array-content-collapsed"}>
          {
            // Show the first 3 elements
            slice.map((d, index) => {
              return (
                <div key={index} className={"cov-array-element"}>
                  <NodeInitial data={d} propName={""} isIndex={false} />
                  {index + 1 !== data.length && <span className={"cov-comma"}>,</span>}
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
