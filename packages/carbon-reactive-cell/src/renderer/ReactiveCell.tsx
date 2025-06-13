import {
  addClass,
  FocusOnInsertPath,
  PinnedSelection,
  removeClass,
  stop,
} from "@emrgen/carbon-core";
import { useRectSelectable } from "@emrgen/carbon-dragon-react";
import {
  CarbonBlock,
  RendererProps,
  useCarbon,
  useNodeChange,
  useSelectionHalo,
} from "@emrgen/carbon-react";
import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { useReactiveRuntime } from "../hooks/useReactiveRuntime";
import { useReactiveVariable } from "../hooks/useReactiveVariable";
import { defineVariable } from "../x";
import { ReactiveCellEditor } from "./ReactiveCellEditor";
import { ReactiveCellViewer } from "./ReactiveCellViewer";

// LiveCell renderer
export const LiveCellComp = (props: RendererProps) => {
  const runtime = useReactiveRuntime();
  const { node } = props;
  const link = node.linkedProps!;

  useEffect(() => {
    defineVariable(runtime, link);
  }, [link, runtime]);

  return (
    <CarbonBlock node={node}>
      <ReactiveCellCompInner node={node.linkedProps!} view={<ReactiveCellViewer node={link} />} />
    </CarbonBlock>
  );
};

interface ReactiveCellProps extends RendererProps {
  view?: ReactNode;
}

// private inner component for ReactiveCell
const ReactiveCellCompInner = (props: ReactiveCellProps) => {
  const { view } = props;
  const app = useCarbon();
  // track node changes using useNodeChange hook
  const ref = useRef<HTMLDivElement>(null);
  const { node } = useNodeChange({ node: props.node });
  useRectSelectable({ node, ref });
  const { SelectionHalo, attributes, isSelected } = useSelectionHalo({ node });

  const onFocus = useCallback(() => {
    if (isSelected) {
      app.cmd
        .Update(node.id, {
          [FocusOnInsertPath]: false,
        })
        .SelectBlocks([])
        .Select(PinnedSelection.SKIP)
        .Dispatch();
    }
  }, [isSelected, app, node.id]);

  return (
    <CarbonBlock node={node} ref={ref} custom={attributes}>
      <div className={"carbon-reactive-cell-container"} onKeyUp={stop} onBeforeInput={stop}>
        {/*NOTE: view is received from the parent to avoid re-rendering of the view on editor state change*/}
        <div className={"reactive-cell-viewer-wrapper"}>
          {view}
          <ReactiveCellStatus node={node} />
        </div>
        <div className={"reactive-cell-editor-wrapper"}>
          <ReactiveCellEditor node={node} onFocus={onFocus} />
        </div>
      </div>
      {SelectionHalo}
    </CarbonBlock>
  );
};

const ReactiveCellStatus = (props: RendererProps) => {
  const [pending, setPending] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useReactiveVariable({
    node: props.node,
    onFulfilled: (value) => {
      removeClass(ref.current!, "pending");
    },
    onRejected: () => {
      removeClass(ref.current!, "pending");
    },
    onProcessing: () => {
      addClass(ref.current!, "pending");
    },
  });

  return <div className={"reactive-cell-status"} ref={ref}></div>;
};
