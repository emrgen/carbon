import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  CarbonBlock,
  RendererProps,
  useCarbon,
  useSelectionHalo,
  BlockContent,
  preventAndStop,
  stop,
  Node, useNodeActivated
} from "@emrgen/carbon-core";
import katex from "katex";
import "katex/dist/katex.min.css";
import {
  Box,
  Center,
  HStack,
  Input,
  Square,
  Stack,
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
import { TbMathXDivideY2 } from "react-icons/tb";
import ResizeTextarea from "react-textarea-autosize";
import { isHotkey, isKeyHotkey } from "is-hotkey";

export const EquationComp = (props: RendererProps) => {
  const { node } = props;
  const app = useCarbon();
  const ref = useRef<Optional<HTMLDivElement>>(null);
  const [error, setError] = useState("");

  const updater = useDisclosure();
  const { ref: overlayRef } = useFastypeOverlay({
    disclosure: updater,
    node,
    onOpen: () => {
      app.disable();
    },
    onClose: () => {
      app.enable();
      app.parkCursor();
      app.tr
        .updateProps(node.id, {
          node: {
            isEditing: false,
          },
        })
        .dispatch();
    },
  });

  const selection = useSelectionHalo(props);
  const dragDropRect = useDragDropRectSelect({ node, ref });
  const connectors = useConnectorsToProps(
    useCombineConnectors(dragDropRect, selection)
  );
  const activated = useNodeActivated(props);

  useEffect(() => {
    if (activated.yes) {
      updater.onOpen();
    } else {
      updater.onClose();
    }
  }, [activated.yes]);

  const handleClick = useCallback(
    (e) => {
      stop(e);
      // avoid selection if block is already selected
      // if (app.blockSelection && app.blockSelection.has(node.id)) return;
      app.tr
        .selectNodes([node.id])
        .updateProps(node.id, {
          node: {
            isEditing: true,
          },
        })
        .dispatch();
    },
    [app.tr, node.id]
  );

  const handleMouseDown = useCallback(
    (e) => {
      const { selection } = app;
      if (selection.isBlock && selection.nodes.some(n => n.id.eq(node.id))) {
        stop(e);
      }
    },
    [app, node.id]
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
          <Stack
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
            onMouseDown={stop}
            onMouseUp={stop}
            onClick={stop}
            spacing={0}
            boxShadow={"0 2px 8px 0px #aaa"}
            overflow={"hidden"}
          >
            <Textarea
              defaultValue={node.child(0)?.textContent}
              placeholder="c = \\pm\\sqrt{a^2 + b^2}"
              _focus={{
                outline: "none",
                boxShadow: "none",
                border: "none",
              }}
              // textColor={node.child(0)?.textContent ? "black" : "red"}
              borderRadius={0}
              px={2}
              display={"block"}
              fontFamily={"mono"}
              fontSize={"sm"}
              letterSpacing={"tighter"}
              border={"none"}
              autoFocus={true}
              overflow="hidden"
              minRows={1}
              as={ResizeTextarea}
              resize={"none"}
              onFocus={(e) => {
                preventAndStop(e);
                e.target.select();
              }}
              onKeyDown={(e) => {
                if (
                  (isKeyHotkey("enter", e) && !isKeyHotkey("shift+enter", e)) ||
                  e.key === "Escape"
                ) {
                  preventAndStop(e);
                  app.tr
                    .updateProps(node.id, {
                      node: {
                        isEditing: false,
                      },
                    })
                    .dispatch();
                }
              }}
              onChange={(e) => {
                preventAndStop(e);
                const title = node.child(0) as Node;
                const text = app.schema.text(e.target.value)!;
                app.enable(() => {
                  app.tr
                    .setContent(title.id, BlockContent.create(text))
                    .dispatch();
                });
              }}
            />
            {!!error && !node.child(0)?.isEmpty && (
              <Box fontSize={"xs"} p={2} color={"red.400"} bg="#eee">
                {error}
              </Box>
            )}
          </Stack>
        ) : null}
      </>,
      overlayRef.current
    );
  }, [app, node, overlayRef, updater, error]);

  return (
    <CarbonBlock
      node={node}
      ref={ref}
      custom={{
        onClick: handleClick,
        onMouseDown: handleMouseDown,
        onKeyDown: stop,
        ...connectors,
      }}
    >
      {updatePopover}
      {/* <CarbonNodeContent node={node} /> */}
      <EquationContent node={node.child(0)!} error={error} onError={setError} />
      {node.child(0)?.isEmpty && (
        <HStack
          w="full"
          justify={"center"}
          color={"#aaa"}
          spacing={0}
          bg={"#eee"}
          // minH={"6px"}
        >
          <Square size={12} borderRadius={4} fontSize={26} color={"#aaa"}>
            <TbMathXDivideY2 />
          </Square>
          <Text>Click to add equation</Text>
        </HStack>
      )}

      {selection.SelectionHalo}
    </CarbonBlock>
  );
};

interface EquationContentProps extends RendererProps {
  onError(msg: string): void;
  error: string;
}

export const EquationContent = (props: EquationContentProps) => {
  const { onError, error } = props;
  const { node, version } = props;
  const eqRef = useRef(null);

  useEffect(() => {
    if (!eqRef.current) return;

    try {
      katex.render(node.textContent, eqRef.current, {
        output: "mathml",
      });
      onError("");
      // console.log("rendered", node.textContent);
    } catch (e) {
      if (e instanceof katex.ParseError) {
        onError(e.message);
      }
    }
  }, [node, version, onError]);

  if (node.textContent === "") return null;

  return (
    <CarbonBlock node={node} custom={{ "data-name": "equation-wrapper" }}>
      <Box
        data-type="equation-content"
        ref={eqRef}
        p={2}
        opacity={error ? 0 : 1}
        minH={"50px"}
      />
      {error && (
        <Center
          h="full"
          bg="#eee"
          pos="absolute"
          w="full"
          left={0}
          overflow={"hidden"}
        >
          <Text fontSize={"sm"}>
            {error.split("\n")?.length > 1
              ? error.split("\n")[0] + "..."
              : error}
          </Text>
        </Center>
      )}
    </CarbonBlock>
  );
};
