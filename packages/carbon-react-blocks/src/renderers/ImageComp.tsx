import React, { useCallback, useRef } from "react";
import {RendererProps} from "@emrgen/carbon-core";
import {CarbonBlock, useCarbon, useSelectionHalo} from "@emrgen/carbon-react";
import {preventAndStop} from "@emrgen/carbon-core";
import {useDragDropRectSelectHalo} from "@emrgen/carbon-dragon-react";

export default function ImageComp(props: RendererProps) {
  const { node } = props;
  const app = useCarbon();
  const ref = useRef<HTMLDivElement>(null);
  const {connectors, SelectionHalo} = useDragDropRectSelectHalo({node, ref});

  const handleClick = (e) => {
    preventAndStop(e);

    app.emit(
      "show:options:menu",
      node.id,
      ref.current?.getBoundingClientRect()
    );

    // react.tr.selectNodes([node.id]).Dispatch();
  };

  const alignImage = useCallback(
    (align) => {
      return (e) => {
        preventAndStop(e);
        const { tr } = app;
        // react.blockSelection.blocks
        //   .filter((n) => n.name === "image")
        //   .forEach(({id}) => {
        //     tr.Update(id, {
        //       html: {
        //         style: {
        //           justifyContent: align,
        //         },
        //       },
        //     });
        //   });
        // tr.Dispatch();
      };
    },
    [app]
  );

  const onClick = useCallback((e) => {
    preventAndStop(e);
    // react.tr.selectNodes([]).Dispatch();
  },[]);

  return (
    <CarbonBlock {...props} custom={{ ...connectors, onClick }} ref={ref}>
      {/*<div className="image-container" onClick={handleClick}>*/}
      {/*  {!node.properties.node.src && <div className="image-overlay">Image</div>}*/}
      {/*  <img src={node.properties.node.src} alt="" />*/}
      {/*  {selection.isSelected && (*/}
      {/*    <div className="image-align-controls">*/}
      {/*      <div*/}
      {/*        className="align-left"*/}
      {/*        onClick={alignImage("start")}*/}
      {/*        onMouseDown={preventAndStop}*/}
      {/*      >*/}
      {/*        <HiMiniBars3BottomLeft />*/}
      {/*      </div>*/}
      {/*      <div*/}
      {/*        className="align-center"*/}
      {/*        onClick={alignImage("center")}*/}
      {/*        onMouseDown={preventAndStop}*/}
      {/*      >*/}
      {/*        <LuAlignCenter />*/}
      {/*      </div>*/}
      {/*      <div*/}
      {/*        className="align-right"*/}
      {/*        onClick={alignImage("end")}*/}
      {/*        onMouseDown={preventAndStop}*/}
      {/*      >*/}
      {/*        <HiMiniBars3BottomRight />*/}
      {/*      </div>*/}
      {/*    </div>*/}
      {/*  )}*/}
      {/*  {selection.SelectionHalo}*/}
      {/*</div>*/}
    </CarbonBlock>
  );
}
