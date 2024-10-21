import {
  CarbonBlock,
  CarbonChildren,
  RendererProps,
} from "@emrgen/carbon-react";
import { useCarbon } from "@emrgen/carbon-react";
import { useCallback } from "react";
import { CheckedPath } from "@emrgen/carbon-core/src/core/NodeProps";
import { LocalDirtyCounterPath } from "@emrgen/carbon-core/src/core/NodeProps";
import { SelectedOptionsPath } from "@emrgen/carbon-core/src/core/NodeProps";
import { useActiveCellRuntime } from "@emrgen/carbon-cell";
import { uniq } from "lodash";

export const MultipleChoiceQuestionComp = (props: RendererProps) => {
  const { node } = props;
  const runtime = useActiveCellRuntime();

  return (
    <CarbonBlock node={node}>
      <div
        contentEditable={true}
        suppressContentEditableWarning={true}
        className={"mcq-container"}
      >
        <CarbonChildren node={node} />
      </div>
    </CarbonBlock>
  );
};

export const MultipleChoiceOptionComp = (props: RendererProps) => {
  const { node } = props;
  const app = useCarbon();

  const index = node.index + 1;

  const updateSelected = useCallback(
    (e) => {
      const parent = node.closest((n) => n.name === "question")!;
      const selected =
        parent.props.get<string[]>(SelectedOptionsPath, []) ?? [];
      if (e.target.checked) {
        selected.push(node.id.toString());
      } else {
        selected.splice(selected.indexOf(node.id.toString()), 1);
      }

      app.cmd
        .Update(node, {
          [CheckedPath]: e.target.checked,
        })
        .Update(parent, {
          [LocalDirtyCounterPath]: Date.now().toString(),
          [SelectedOptionsPath]: uniq(selected),
        })
        .Dispatch();
    },
    [app, node],
  );

  return (
    <CarbonBlock node={props.node}>
      <div className={"multiple-choice-option"}>
        <div
          className={"multiple-choice-option__input"}
          contentEditable={false}
          key={node.key}
        >
          {index}
        </div>
        <CarbonChildren node={props.node} />
        <div className={"mcq-answer-checkbox"} contentEditable={false}>
          <input
            type={"checkbox"}
            onChange={updateSelected}
            value={node.props.get(CheckedPath)}
          />
        </div>
      </div>
    </CarbonBlock>
  );
};
