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
import {
  useCombineConnectors,
  useConnectorsToProps,
  useDragDropRectSelect,
} from "@emrgen/carbon-dragon";
import { IconButton, Flex, Box } from "@chakra-ui/react";
import { TbStatusChange } from "react-icons/tb";

export function ImageComp(props: RendererProps) {
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

    app.tr.selectNodes([node.id]).dispatch();
  };

  const alignImage = useCallback(
    (align) => {
      return (e) => {
        preventAndStop(e);
        const { tr } = app;
        app.blockSelection.blocks
          .filter((n) => n.name === "image")
          .forEach(({ id }) => {
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

  const onClick = useCallback(
    (e) => {
      preventAndStop(e);
      app.tr.selectNodes([]).dispatch();
    },
    [app.tr]
  );

  return (
    <>
      <CarbonBlock {...props} custom={{ ...connectors, onClick }} ref={ref}>
        <div className="image-container" onClick={handleClick}>
          <Flex
            className="image-controls"
            pos={"absolute"}
            top={0}
            right={0}
            mr={1}
            mt={1}
          >
            <IconButton
              colorScheme={"facebook"}
              size={"sm"}
              aria-label="Search database"
              icon={<TbStatusChange />}
              onClick={preventAndStop}
            />
          </Flex>
          {!node.attrs.node.src && <div className="image-overlay">Image</div>}
          <img src={node.attrs.node.src} alt="" />
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
    </>
  );
}
