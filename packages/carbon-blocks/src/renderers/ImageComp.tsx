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
import { useCombineConnectors, useConnectorsToProps, useDragDropRectSelect } from "@emrgen/carbon-dragon";

export default function ImageComp(props: RendererProps) {
  const { node } = props;
  const app = useCarbon();
  const ref = useRef<HTMLDivElement>(null);

  const selection = useSelectionHalo(props);
  const dragDropRect = useDragDropRectSelect({ node, ref });
  const connectors = useConnectorsToProps(
    useCombineConnectors(dragDropRect, selection)
  );

  const handleClick = (e) => {
    preventAndStop(e);

    app.emit(
      "show:options:menu",
      node.id,
      ref.current?.getBoundingClientRect()
    );

    app.tr.selectNodes([node.id]).Dispatch();
  };

  const alignImage = useCallback(
    (align) => {
      return (e) => {
        preventAndStop(e);
        const { tr } = app;
        app.blockSelection.blocks
          .filter((n) => n.name === "image")
          .forEach(({id}) => {
            tr.Update(id, {
              html: {
                style: {
                  justifyContent: align,
                },
              },
            });
          });
        tr.Dispatch();
      };
    },
    [app]
  );

  const onClick = useCallback((e) => {
    preventAndStop(e);
    app.tr.selectNodes([]).Dispatch();
  },[app.tr]);

  return (
    <CarbonBlock {...props} custom={{ ...connectors, onClick }} ref={ref}>
      <div className="image-container" onClick={handleClick}>
        {!node.properties.node.src && <div className="image-overlay">Image</div>}
        <img src={node.properties.node.src} alt="" />
        {selection.isSelected && (
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
        {selection.SelectionHalo}
      </div>
    </CarbonBlock>
  );
}
