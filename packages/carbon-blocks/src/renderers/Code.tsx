import React, { useRef } from "react";
import {
  BlockContent,
  CarbonBlock,
  CarbonNode,
  CarbonNodeChildren,
  CarbonNodeContent,
  RendererProps,
  preventAndStop,
  stop,
  useCarbon,
  useNodeChange,
  useSelectionHalo,
} from "@emrgen/carbon-core";

export const CodeComp = (props: RendererProps) => {
  const { node } = props;
  const ref = useRef(null);
  const { attributes, SelectionHalo } = useSelectionHalo(props);
  const app = useCarbon();

  // const { listeners } = useDragDropRectSelect({ node, ref });
  // console.log(attributes);
  // console.log(node.attrs.node.emptyPlaceholder, node.name);
  console.log(node.child(0));

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    stop(e);
  };

  const handleKeyUp = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    stop(e);
  };

  const handleOnChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    stop(e);
    const { value } = e.target;
    const text = app.schema.text(value)!;
    app.enable(() => {
      app.tr
        .setContent(node.child(0)?.id!, BlockContent.create([text]))
        .dispatch();
    });
  };

  return (
    <CarbonBlock node={node} ref={ref} custom={{ ...attributes }}>
      {/* <div className="carbon-code-content">
        <pre>
          <code></code>
        </pre>
      </div> */}
      <textarea
        className="carbon-code-textarea"
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        defaultValue={node.textContent}
        onChange={handleOnChange}
        onFocus={() => app.disable()}
        onBlur={() => app.enable()}
      />
      {SelectionHalo}
    </CarbonBlock>
  );
};
