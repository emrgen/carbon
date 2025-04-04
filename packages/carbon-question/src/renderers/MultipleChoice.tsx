import { useActiveCellRuntime } from "@emrgen/carbon-cell";
import {
  CheckedPath,
  SelectedOptionsPath,
} from "@emrgen/carbon-core/src/core/NodeProps";
import {
  CarbonBlock,
  CarbonChildren,
  RendererProps,
  useCarbon,
} from "@emrgen/carbon-react";
import { uniq } from "lodash";
import { useCallback } from "react";

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
        // update the parent node with the selected options
        .Update(parent, {
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
