import {
  Box,
  Button,
  Center,
  Flex,
  IconButton,
  Input,
  Spinner,
  Square,
  Stack,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { preventAndStop, stop } from "@emrgen/carbon-core";
import {
  useCombineConnectors,
  useConnectorsToProps,
  useDragDropRectSelect,
} from "@emrgen/carbon-dragon-react";
import {
  CarbonBlock,
  RendererProps,
  useCarbon,
  useCarbonOverlay,
  useSelectionHalo,
} from "@emrgen/carbon-react";
import { Form, Formik } from "formik";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { RxImage } from "react-icons/rx";
import { TbStatusChange } from "react-icons/tb";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { ResizableContainer } from "../MediaView";

const CaptionPath = "remote/state/caption";

export function ImageComp(props: RendererProps) {
  const { node } = props;
  const app = useCarbon();
  const [ready, setReady] = useState(false);
  const caption = node.props.get(CaptionPath, "");

  const ref = useRef<HTMLDivElement>(null);
  const boundRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const updater = useDisclosure();
  const { ref: overlayRef } = useCarbonOverlay();

  const selection = useSelectionHalo(props);
  const dragDropRect = useDragDropRectSelect({ node, ref });
  const connectors = useConnectorsToProps(
    useCombineConnectors(dragDropRect, selection),
  );

  const [aspectRatio, setAspectRatio] = useState(9 / 16);

  const handleClick = (e) => {
    preventAndStop(e);

    app.emit(
      "show:options:menu",
      node.id,
      ref.current?.getBoundingClientRect(),
    );
  };

  const alignImage = useCallback(
    (align) => {
      return (e) => {
        preventAndStop(e);
        const { tr } = app;
        app.selection.blocks
          .filter((n) => n.name === "image")
          .forEach(({ id }) => {
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
    [app],
  );

  const onClick = useCallback(
    (e) => {
      // preventAndStop(e);
    },
    [app.tr],
  );

  const updatePopover = useMemo(() => {
    // console.log(overlayRef, ref);

    if (!overlayRef.current) return null;
    if (!boundRef.current) return null;
    const { left, top, width, height } =
      boundRef.current?.getBoundingClientRect();

    // console.log("updatePopover", left, top, width, height);

    return createPortal(
      <Box
        pos={"absolute"}
        w={width + "px"}
        h={height + "px"}
        left={left}
        top={top}
        zIndex={1000}
      >
        <Box
          contentEditable={false}
          suppressContentEditableWarning
          pos={"absolute"}
          bottom={"100%"}
          left={"50%"}
          bg="white"
          transform={"translate(-50%,0)"}
          boxShadow={"0 0 10px 0 #aaa"}
          borderRadius={6}
          p={4}
          zIndex={1001}
          onBeforeInput={stop}
          onKeyUp={(e) => {
            stop(e);
            if (e.key === "Escape") {
              updater.onClose();
            }
          }}
          onKeyDown={stop}
        >
          <Formik
            initialValues={{
              src: "",
            }}
            onSubmit={(values, actions) => {
              actions.setSubmitting(false);
              const { src } = values;
              if (!src) return;

              // console.log("values", values, actions);
              actions.setSubmitting(true);
              // console.log("submit", values.src);

              setTimeout(() => {
                updater.onClose();
                actions.setSubmitting(false);
                app.tr
                  .Update(node.id, {
                    node: {
                      src: values.src,
                      // height:
                      //   boundRef.current ? boundRef.current?.offsetWidth * (9 / 16) : 200,
                    },
                  })
                  .Dispatch();
              }, 1000);
            }}
          >
            {(props) => (
              <Form>
                <Stack w={300} spacing={4}>
                  <Input
                    autoFocus
                    placeholder="Image URL"
                    size="sm"
                    id="src"
                    name="src"
                    autoComplete="off"
                    onChange={props.handleChange}
                  />
                  <Input
                    autoFocus
                    placeholder="Image URL"
                    size="sm"
                    id="src"
                    name="src"
                    autoComplete="off"
                    // onChange={props.handleChange}
                  />
                  <Button
                    colorScheme="blue"
                    size="sm"
                    type="submit"
                    onMouseDown={stop}
                    onClick={stop}
                    isLoading={props.isSubmitting}
                    cursor={"pointer"}
                  >
                    Update
                  </Button>
                </Stack>
              </Form>
            )}
          </Formik>
        </Box>
      </Box>,
      overlayRef.current!,
    );
  }, [app.tr, node.id, boundRef, overlayRef, updater]);

  useEffect(() => {
    if (!imageRef.current) return;
    const { width, height } = imageRef.current;
    setAspectRatio(height / width);

    // if (!node.props.node.height) {
    //   app.tr
    //     .Update(node.id, {
    //       node: {
    //         height: height,
    //       },
    //     })
    //     .Dispatch();
    // }
  }, [app, imageRef, node]);

  return (
    <>
      <CarbonBlock {...props} custom={{ ...connectors, onClick }} ref={ref}>
        {updater.isOpen && updatePopover}

        <ResizableContainer
          node={node}
          enable={ready}
          aspectRatio={aspectRatio}
          boundedComponent={
            image.src && (
              <Box pos={"absolute"} h="full" w="full" ref={boundRef}>
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
                    onMouseDown={preventAndStop}
                    onClick={(e) => {
                      preventAndStop(e);
                      updater.onOpen();
                    }}
                  />
                </Flex>
              </Box>
            )
          }
        >
          <Box
            className="image-container"
            pos={"relative"}
            onClick={handleClick}
            bg={ready ? "" : "#eee"}
            h={node.props.node.src && !ready ? "100%" : "auto"}
            // boxShadow={ready ? "0 0 0px 20px red" : ""}
          >
            <>
              {!image.src && (
                <Flex
                  ref={boundRef}
                  className="image-overlay"
                  onClick={(e) => {
                    stop(e);
                    // app.tr.selectNodes([node.id]).Dispatch();
                    updater.onOpen();
                  }}
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
                  <Text>Click to add image</Text>
                </Flex>
              )}

              {image.src && (
                <>
                  <LazyLoadImage
                    src={node.props.node.src}
                    alt=""
                    onLoad={(e) => {
                      setReady(true);
                      console.log(e);
                    }}
                    placeholder={<Center color="#aaa">Image loading...</Center>}
                  />
                  {/* <Image
                    src={node.attrs.node.src}
                    alt=""
                    className="fastype-hidden-image"
                    pos={"absolute"}
                    boxShadow={ready ? "0 0 0px 20px red" : ""}
                    // opacity={"0"}
                    ref={imageRef}
                  /> */}
                  <Spinner
                    pos={"absolute"}
                    bottom={0}
                    right={0}
                    zIndex={10}
                    size="sm"
                    m={2}
                    color="#555"
                    display={image.src ? (ready ? "none" : "block") : "none"}
                  />
                </>
              )}
            </>
            {selection.SelectionHalo}
          </Box>
        </ResizableContainer>

        {/* {caption && (
          <Input
            value={node.attrs.node.caption}
            px={1}
            color="#999"
            onMouseDown={stop}
            onKeyDown={(e) => {
              stop(e);
              if (e.key === "Enter") {
                e.preventDefault();
                react.enable()
                const paragraph = react.schema.nodes.paragraph.default();
                if (!paragraph) return;
                react.tr
                  .insert(Point.toAfter(node.id), section)
                  .select(
                    PinnedSelection.fromPin(Pin.toStartOf(section)!),
                    ActionOrigin.UserInput
                  )
                  .Dispatch();
              }
            }}
            onKeyUp={stop}
            onFocus={() => react.disable()}
            onBlur={(e) => {
              react.enable()
              setCaption(!!e.target.value)
            }}
            outline={"none"}
            border={"none"}
            boxShadow={"none"}
            placeholder="Caption"
            size={"sm"}
            _active={{
              border: "none",
              boxShadow: "none",
            }}
            _focus={{
              border: "none",
              boxShadow: "none",
            }}
            onChange={(e) => {
              react.tr
                .updateAttrs(node.id, {
                  node: {
                    caption: e.target.value,
                  },
                })
                .Dispatch();
            }}
          />
        )} */}
      </CarbonBlock>
    </>
  );
}
