import { Observable } from "@emrgen/carbon-cell";
import {
  CarbonBlock,
  CarbonChildren,
  RendererProps,
  useSelectionHalo,
} from "@emrgen/carbon-react";
import { FaRegCopy } from "react-icons/fa";

export const QuestionComp = (props: RendererProps) => {
  const { node } = props;
  const { SelectionHalo } = useSelectionHalo(props);

  return (
    <Observable node={node}>
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
        {/*<div className={"question__footer"} contentEditable={false}>*/}
        {/*  <div className={"question__footer-add-hint"}>Add Hint</div>*/}
        {/*  <div className={"question__footer-add-explanation"}>*/}
        {/*    Add Explanation*/}
        {/*  </div>*/}
        {/*</div>*/}
        {SelectionHalo}
      </CarbonBlock>
    </Observable>
  );
};
