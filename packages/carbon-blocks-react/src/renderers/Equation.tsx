import React, { useEffect, useMemo, useRef, useState } from "react";

import katex from "katex";
import "katex/dist/katex.min.css";
import {CarbonBlock, useCarbon, useSelectionHalo, RendererProps} from "@emrgen/carbon-react";
export const EquationComp = (props: RendererProps) => {
  const { node } = props;
  const { SelectionHalo } = useSelectionHalo(props);
  const app = useCarbon();
  const ref = useRef<any>();

  useEffect(() => {
    if (!ref.current) return;
    katex.render(node.textContent, ref.current, {
      output: "mathml",
    });
  }, [node, node.renderVersion]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
  };

  const handleOnClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    // setPower(power + 1)
    // const title = react.schema.nodeFromJSON({
    //   name: 'title',
    //   content: [
    //     {
    //       name: 'text',
    //       text: `x^${power}`
    //     }
    //   ]
    // })!
    // react.tr
      // .setContent(node.id, BlockContent.create([title!]))
      // .forceRender([node.id]).Dispatch();
    // react.tr.activateNodes([node.id]).Dispatch();
  };

  return (
    <CarbonBlock
      {...props}
      // custom={{ "data-active": isActive, "data-content-editable-void": "true" }}
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
