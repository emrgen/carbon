import { stop } from "@emrgen/carbon-core";
import { useRectSelectable } from "@emrgen/carbon-dragon-react";
import { CarbonBlock, RendererProps, useNodeChange, useSelectionHalo } from "@emrgen/carbon-react";
import { useRef } from "react";
import { ReactiveCellEditor } from "./ReactiveCellEditor";
import { ReactiveCellViewer } from "./ReactiveCellViewer";

// ReactiveCell renderer
export const ReactiveCellComp = (props: RendererProps) => {
  const { node } = props;

  return (
    <CarbonBlock node={node}>
      <ReactiveCellCompInner node={node.linkedProps!} />
    </CarbonBlock>
  );
};

// private inner component for ReactiveCell
const ReactiveCellCompInner = (props: RendererProps) => {
  // track node changes using useNodeChange hook
  const ref = useRef<HTMLDivElement>(null);
  const { node } = useNodeChange({ node: props.node });
  useRectSelectable({ node, ref });
  const { SelectionHalo, attributes } = useSelectionHalo({ node });

  return (
    <CarbonBlock node={node} ref={ref} custom={attributes}>
      <div className={"carbon-reactive-cell-container"} onKeyUp={stop} onBeforeInput={stop}>
        <ReactiveCellViewer node={node} />
        <ReactiveCellEditor node={node} />
      </div>
      {SelectionHalo}
    </CarbonBlock>
  );
};
