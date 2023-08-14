import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  CarbonBlock,
  CarbonNodeChildren,
  CarbonNodeContent,
  RendererProps,
  useCarbon,
  useNodeChange,
  useNodeStateChange,
  useSelectionHalo,
  BlockContent,
  preventAndStop,
  stop,
} from "@emrgen/carbon-core";
import katex from "katex";
import "katex/dist/katex.min.css";
import { node } from "@emrgen/carbon-blocks";
import {
  Box,
  HStack,
  Input,
  Square,
  Text,
  Textarea,
  useDisclosure,
} from "@chakra-ui/react";
import { RxImage } from "react-icons/rx";
import {
  useCombineConnectors,
  useConnectorsToProps,
  useDragDropRectSelect,
} from "@emrgen/carbon-dragon";
import { useFastypeOverlay } from "../../hooks/useFastypeOverlay";
import { createPortal } from "react-dom";
import { Optional } from "@emrgen/types";

export const EquationComp = (props: RendererProps) => {
  const { node, version } = props;
  const { SelectionHalo } = useSelectionHalo(props);
  const { isActive } = useNodeStateChange(props);
  const app = useCarbon();
  const ref = useRef<Optional<HTMLDivElement>>(null);
  const eqRef = useRef(null);

  const updater = useDisclosure();
  const { ref: overlayRef } = useFastypeOverlay(updater, node);

  const selection = useSelectionHalo(props);
  const dragDropRect = useDragDropRectSelect({ node, ref });
  const connectors = useConnectorsToProps(
    useCombineConnectors(dragDropRect, selection)
  );

  useEffect(() => {
    if (!eqRef.current) return;
    katex.render(node.textContent, eqRef.current, {
      output: "mathml",
    });
  }, [node, node.version]);

  const handleClick = useCallback(
    (e) => {
      updater.onOpen();
      stop(e);
      // avoid selection if block is already selected
      if (app.blockSelection && app.blockSelection.has(node.id)) return;
      app.tr.selectNodes([node.id]).dispatch();
    },
    [app.blockSelection, app.tr, node.id, updater]
  );

  const handleMouseDown = useCallback(
    (e) => {
      if (app.blockSelection && app.blockSelection.has(node.id)) {
        stop(e);
      }
    },
    [app.blockSelection, node.id]
  );

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

  const updatePopover = useMemo(() => {
    console.log(overlayRef, ref);

    if (!overlayRef.current) return null;
    if (!ref.current) return null;
    const { left, top, width, height } = ref.current?.getBoundingClientRect();

    return createPortal(
      <>
        {updater.isOpen ? (
          <Box
            pos={"absolute"}
            w={width / 2 + "px"}
            left={left + width / 2 + "px"}
            top={top + height + "px"}
            transform={"translate(-50%, 0)"}
            zIndex={10000}
            bg={"#fff"}
            m={0}
            // onMouseDown={stop}
            // onMouseUp={stop}
            borderRadius={4}
            contentEditable={false}
            suppressContentEditableWarning
            // onBeforeInput={stop}
          >
            <Input
          defaultValue={node.child(0)?.textContent}
          // onFocus={() => app.disable()}
          // onBlur={() => app.enable()}
          border={'none'}
          autoFocus
        />
            asdas asd asd
          </Box>
        ) : null}
      </>,
      overlayRef.current
    );
  }, [node, overlayRef, updater.isOpen]);

  return (
    <CarbonBlock
      node={node}
      ref={ref}
      custom={{
        onClick: handleClick,
        onMouseDown: handleMouseDown,
        ...connectors,
      }}
    >
      {updatePopover}
      {!node.child(0)?.isEmpty && (
        <Box data-type="equation-content" ref={eqRef} p={4} />
      )}
      {node.child(0)?.isEmpty && (
        <HStack
          w="full"
          justify={"center"}
          color={"#aaa"}
          spacing={0}
          bg={"#eee"}
          minH={"60px"}
        >
          <Square
            size={12}
            borderRadius={4}
            // border={"1px solid #ddd"}
            // bg={"#fff"}
            fontSize={26}
            color={"#aaa"}
          >
            <RxImage />
          </Square>
          <Text>Click to add equation</Text>
        </HStack>
      )}
      {/* <div
        className="equation-cover"
        onMouseDown={handleMouseDown}
        onClick={handleOnClick}
      /> */}
      {/* show editable text area */}
      {/* <CarbonNodeContent node={node} wrapper={{ contentEditable: true }} /> */}
      {selection.SelectionHalo}
    </CarbonBlock>
  );
};
