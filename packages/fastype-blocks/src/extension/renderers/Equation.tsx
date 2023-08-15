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
  PinnedSelection,
  Pin,
  ActionOrigin,
  Point,
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
import { TbMathXDivideY2 } from 'react-icons/tb';

export const EquationComp = (props: RendererProps) => {
  const { node, version } = props;
  const app = useCarbon();
  const ref = useRef<Optional<HTMLDivElement>>(null);
  const eqRef = useRef(null);

  const updater = useDisclosure();
  const { ref: overlayRef } = useFastypeOverlay({
    disclosure: updater,
    node,
    onOpen: () => {
      app.disable();
    },
    onClose: () => {
      app.enable();
      app.focus();
       app.tr
         .updateAttrs(node.id, {
           node: {
             isEditing: false,
           },
         })
         .dispatch();
    }
  });

  const selection = useSelectionHalo(props);
  const dragDropRect = useDragDropRectSelect({ node, ref });
  const connectors = useConnectorsToProps(
    useCombineConnectors(dragDropRect, selection)
  );

  useEffect(() => {
    const { isEditing } = node.attrs.node;
    if (isEditing) {
      updater.onOpen();
    } else {
      updater.onClose();
    }
  }, [node.attrs.node, updater]);

  useEffect(() => {
    if (!eqRef.current) return;
    katex.render(node.textContent, eqRef.current, {
      output: "mathml",
    });
  }, [node, node.version]);

  const handleClick = useCallback(
    (e) => {
      stop(e);
      // avoid selection if block is already selected
      // if (app.blockSelection && app.blockSelection.has(node.id)) return;
      app.tr.selectNodes([node.id]).updateAttrs(node.id, {
        node: {
          isEditing: true,
        }
      }).dispatch();
    },
    [app.tr, node.id]
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
    // console.log(overlayRef, ref);

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
            borderRadius={4}
            contentEditable={false}
            suppressContentEditableWarning
          >
            <Textarea
              defaultValue={node.child(0)?.textContent}
              _focus={{ outline: "none", boxShadow: "0 2px 8px 0px #aaa", border: "none" }}
              border={"none"}
              autoFocus={true}
              onFocus={(e) => {
                preventAndStop(e);
                e.target.select();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  preventAndStop(e);
                  app.tr
                    .updateAttrs(node.id, {
                      node: {
                        isEditing: false,
                      },
                    })
                    .dispatch();
                }
              }}
            />
          </Box>
        ) : null}
      </>,
      overlayRef.current
    );
  }, [app, node, overlayRef, updater]);

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
            fontSize={26}
            color={"#aaa"}
          >
            <TbMathXDivideY2 />
          </Square>
          <Text>Click to add equation</Text>
        </HStack>
      )}
      {selection.SelectionHalo}
    </CarbonBlock>
  );
};
