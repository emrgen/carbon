import React, { useRef } from "react";
import {
  CarbonBlock,
  CarbonChildren,
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

  return (
    <CarbonBlock node={node} ref={ref} custom={{ ...attributes }}>
      <CarbonChildren node={node} />
      {SelectionHalo}
    </CarbonBlock>
  );
};
