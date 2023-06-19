import React, { useEffect, useMemo, useRef, useState } from "react";

import {
  CarbonBlock,
  CarbonNodeChildren,
  CarbonNodeContent,
  RendererProps,
  useCarbon,
  useNodeChange,
  useNodeStateChange,
  useSelectionHalo,
  BlockContent
} from "@emrgen/carbon-core";
import katex from "katex";
import "katex/dist/katex.min.css";
export const EquationComp = (props: RendererProps) => {
  const { node, version } = props;
  const { SelectionHalo } = useSelectionHalo(props);
  const { isActive } = useNodeStateChange(props);
  const app = useCarbon();
  const ref = useRef<any>();
  // const [power, setPower] = useState(1)
  // const {version} = useNodeChange(props);

  useEffect(() => {
    if (!ref.current) return;
    katex.render(node.textContent, ref.current, {
      output: "mathml",
    });
  }, [node, node.version]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
  };

  const handleOnClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    // setPower(power + 1)
    // const title = app.schema.nodeFromJSON({
    //   name: 'title',
    //   content: [
    //     {
    //       name: 'text',
    //       text: `x^${power}`
    //     }
    //   ]
    // })!
    // app.tr
      // .setContent(node.id, BlockContent.create([title!]))
      // .forceRender([node.id]).dispatch();
    app.tr.activateNodes([node.id]).dispatch();
  };

  return (
    <CarbonBlock
      {...props}
      custom={{ "data-active": isActive, "data-content-editable-void": "true" }}
    >
      <div data-type="equation-content" ref={ref} />
      <div
        className="equation-cover"
        onMouseDown={handleMouseDown}
        onClick={handleOnClick}
      />
      {/* show editable text area */}
      {/* <CarbonNodeContent node={node} wrapper={{ contentEditable: true }} /> */}
      {SelectionHalo}
    </CarbonBlock>
  );
};
