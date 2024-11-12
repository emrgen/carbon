import { useRef } from "react";

import {
  CarbonBlock,
  CarbonNodeChildren,
  CarbonNodeContent,
  RendererProps,
  useSelectionHalo
} from "@emrgen/carbon-react";
import {useDragDropRectSelectHalo} from "@emrgen/carbon-dragon-react";

export const QuestionComp = (props: RendererProps) => {
  const { node } = props;
  const ref = useRef(null);
  const {connectors, SelectionHalo} = useDragDropRectSelectHalo({node, ref})

  return (
    <CarbonBlock node={node} ref={ref} custom={{...connectors, id: node.key}}>
      <CarbonNodeContent
        node={node}
        // afterContent={
        //   <span data-required='true' contentEditable={'false'} suppressContentEditableWarning={true}>?</span>
        // }
      />
      <CarbonNodeChildren node={node} />
      {SelectionHalo}
    </CarbonBlock>
  );
};
