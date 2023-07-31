import React, { useCallback, useRef } from "react";
import {
  CarbonBlock,
  RendererProps,
  preventAndStop,
  useCarbon,
  useNodeChange,
  useSelectionHalo,
} from "@emrgen/carbon-core";

import { HiMiniBars3BottomLeft, HiMiniBars3BottomRight } from "react-icons/hi2";
import { LuAlignCenter } from "react-icons/lu";

export default function ImageComp(props: RendererProps) {
  const { node } = props;
  const app = useCarbon();
  const { SelectionHalo, attributes, isSelected } = useSelectionHalo(props);
  const ref = useRef<HTMLDivElement>(null);

  const handleClick = (e) => {
    preventAndStop(e);

    app.emit(
      "show:options:menu",
      node.id,
      ref.current?.getBoundingClientRect()
    );

    app.tr.selectNodes([node.id]).dispatch();
  };

  const alignImage = useCallback(
    (align) => {
      return (e) => {
        preventAndStop(e);
        const { tr } = app;
        app.blockSelection.blocks
          .filter((n) => n.name === "image")
          .forEach(({id}) => {
            tr.updateAttrs(id, {
              html: {
                style: {
                  justifyContent: align,
                },
              },
            });
          });
        tr.dispatch();
      };
    },
    [app]
  );

  return (
    <CarbonBlock {...props} custom={{ ...attributes }}>
      <div className="image-container" onClick={handleClick} ref={ref}>
        <img src={node.attrs.node.src} alt="" />
        {isSelected && (
          <div className="image-align-controls">
            <div
              className="align-left"
              onClick={alignImage("start")}
              onMouseDown={preventAndStop}
            >
              <HiMiniBars3BottomLeft />
            </div>
            <div
              className="align-center"
              onClick={alignImage("center")}
              onMouseDown={preventAndStop}
            >
              <LuAlignCenter />
            </div>
            <div
              className="align-right"
              onClick={alignImage("end")}
              onMouseDown={preventAndStop}
            >
              <HiMiniBars3BottomRight />
            </div>
          </div>
        )}
        {SelectionHalo}
      </div>
    </CarbonBlock>
  );
}
