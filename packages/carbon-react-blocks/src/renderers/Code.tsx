import React, { useEffect, useRef } from "react";
import {
  CarbonBlock,
  CarbonNode,
  RendererProps,
  useCarbon,
  useSelectionHalo,
} from "@emrgen/carbon-react";
import { stop } from "@emrgen/carbon-core/src/utils/event";

export const CodeComp = (props: RendererProps) => {
  const { node } = props;
  const ref = useRef(null);
  const { attributes, SelectionHalo } = useSelectionHalo(props);
  const app = useCarbon();

  // const { listeners } = useDragDropRectSelect({ node, ref });
  // console.log(attributes);
  // console.log(node.attrs.node.emptyPlaceholder, node.name);

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
      app.tr.SetContent(node.child(0)?.id!, [text]).Dispatch();
    });
  };

  useEffect(() => {
    console.log(node.textContent);
  }, [node]);

  return (
    <CarbonBlock node={node} ref={ref} custom={{ ...attributes }}>
      <CarbonNode node={node.firstChild!} tag={"code"} />
      {SelectionHalo}
    </CarbonBlock>
  );
};
