import { useActiveCellRuntime } from "@emrgen/carbon-cell";
import {
  CarbonBlock,
  CarbonChildren,
  RendererProps,
} from "@emrgen/carbon-react";
import { useEffect } from "react";
import { FaRegCopy } from "react-icons/fa";

export const QuestionComp = (props: RendererProps) => {
  const { node } = props;
  const runtime = useActiveCellRuntime();

  useEffect(() => {
    runtime.redefineNode(node.id.toString());
  }, [node, runtime]);

  useEffect(() => {
    runtime.observeNode(node.id.toString());
    return () => {
      runtime.unobserveNode(node.id.toString());
    };
  }, []);

  return (
    <CarbonBlock {...props}>
      <div
        className={"cq__right-content"}
        contentEditable={false}
        suppressContentEditableWarning={true}
      >
        <div
          className={"cq__id"}
          onClick={() => {
            navigator.clipboard.writeText(`node_${node.id.toString()}`);
          }}
        >
          {node.id.toString()}
          <FaRegCopy />
        </div>
        <div className={"cq__marks"}>Marks: {node.props.get("marks", 1)}</div>
      </div>
      <CarbonChildren node={props.node} />
      <div className={"question__footer"} contentEditable={false}>
        <div className={"question__footer-add-hint"}>Add Hint</div>
        <div className={"question__footer-add-explanation"}>
          Add Explanation
        </div>
      </div>
    </CarbonBlock>
  );
};
