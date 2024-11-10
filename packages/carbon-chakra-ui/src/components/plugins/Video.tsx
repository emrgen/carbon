import { Form, Formik } from "formik";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  Box,
  Button,
  Flex,
  IconButton,
  Input,
  Spinner,
  Square,
  Stack,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import ReactPlayer from "react-player";
import { preventAndStop, stop } from "@emrgen/carbon-core";
import {
  CarbonBlock,
  RendererProps,
  useCarbon,
  useCarbonOverlay,
  useSelectionHalo,
} from "@emrgen/carbon-react";
import {
  useCombineConnectors,
  useConnectorsToProps,
  useDragDropRectSelect,
} from "@emrgen/carbon-dragon-react";

import { ResizableContainer } from "../MediaView";
import { createPortal } from "react-dom";
import { RxVideo } from "react-icons/rx";
import { TbStatusChange } from "react-icons/tb";
import { VideoSrcPath } from "@emrgen/carbon-media";
import {useDimensions} from "@emrgen/carbon-react";
import { isEmpty } from "lodash";

export function VideoComp(props: RendererProps) {
  const { node } = props;
  const app = useCarbon();
  const updater = useDisclosure();
  const { ref: overlayRef } = useCarbonOverlay();

  const boundRef = useRef<any>(null);
  const ref = useRef<any>(null);
  const containerRef = useRef<any>(null);
  const [height, setHeight] = useState(200);
  const dimensions = useDimensions(containerRef, true);
  const [ready, setReady] = useState(false);
  const videoUrl = node.props.get(VideoSrcPath, "");

  console.log(dimensions, containerRef);
  
  const selection = useSelectionHalo(props);
  const dragDropRect = useDragDropRectSelect({ node, ref });

  useEffect(() => {
    if (isEmpty(dimensions)) return;
    console.log("dimensions", dimensions);
    const width = dimensions.width ?? 150 * (9 / 16);
    setHeight(width * (9 / 16));
    // console.log(ref.current.offsetWidth);
  }, [dimensions]);

  const onClick = useCallback(
    (e) => {
      // preventAndStop(e);
      // react.tr.selectNodes([]).Dispatch();
    },
    []
  );

  const updatePopover = useMemo(() => {
    if (!overlayRef.current) return null;
    if (!boundRef.current) return null;
    const { left, top, width, height } =
      boundRef.current?.getBoundingClientRect();
    return createPortal(
      <Box pos={"absolute"} w={width} h={height} left={left} top={top}>
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
          zIndex={1000}
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
            initialValues={{url: videoUrl}}
            onSubmit={(values, actions) => {
              const { url } = values;
              if (!url) return;

              console.log("values", values, actions);
              actions.setSubmitting(true);
              console.log("submit", values.url);

              setTimeout(() => {
                updater.onClose();
                actions.setSubmitting(false);
                app.tr
                  .Update(node.id, {
                    node: {
                      url: values.url,
                      height: boundRef.current?.offsetWidth * (9 / 16),
                    },
                  })
                  .Dispatch();
              }, 1000);
            }}
          >
            {({ values, handleChange, isSubmitting }) => (
              <Form>
                <Stack w={300} spacing={4}>
                  <Input
                    autoFocus
                    placeholder="Video URL"
                    size="sm"
                    id="url"
                    name="url"
                    autoComplete="off"
                    defaultValue={values.url}
                    onChange={handleChange}
                  />
                  <Button
                    colorScheme="blue"
                    size="sm"
                    type="submit"
                    onMouseDown={stop}
                    onClick={stop}
                    isLoading={isSubmitting}
                  >
                    Update
                  </Button>
                </Stack>
              </Form>
            )}
          </Formik>
        </Box>
      </Box>,
      overlayRef.current,
    );
  }, [overlayRef, videoUrl, updater, app, node]);

  return (
    <CarbonBlock {...props} ref={ref}>
      {updater.isOpen && updatePopover}

      {videoUrl && (
        <ResizableContainer
          ref={containerRef}
          node={node}
          enable={ready}
          height={height}
          aspectRatio={9 / 16}
        >
          <Flex
            pos="absolute"
            w="full"
            h="full"
            top={0}
            left={0}
            bg="#eee"
            ref={boundRef}
          >
            <Flex
              className="video-controls"
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
                onClick={(e) => {
                  preventAndStop(e);
                  updater.onOpen();
                }}
              />
            </Flex>

            <ReactPlayer
              onReady={() => {
                setReady(true);
              }}
              url={videoUrl}
              controls
              width={"100%"}
              height={"100%"}
              // get the length of the video
              // onDuration={(duration) => console.log("onDuration", duration)}
              // onProgress={throttle(
              //   (progress) => console.log("onProgress", progress),
              //   1000
              // )}
              config={{
                youtube: {
                  playerVars: {},
                },
              }}
            />
            <Spinner
              pos={"absolute"}
              bottom={0}
              right={0}
              zIndex={10}
              // bg={"#eee"}
              size="sm"
              m={2}
              color="#555"
              display={videoUrl ? "none":"block"}
            />
          </Flex>
          {selection.SelectionHalo}
        </ResizableContainer>
      )}

      {/*  */}
      {/* {!videoUrl && (
        <Box w="full">
          <Flex
            className="video-overlay"
            onClick={() => {
              updater.onOpen();
            }}
            ref={boundRef}
          >
            <Square size={12} borderRadius={4} fontSize={26} color={"#aaa"}>
              <RxVideo />
            </Square>
            <Text>Click to add video</Text>
          </Flex>
          <Spinner
            pos={"absolute"}
            bottom={0}
            right={0}
            zIndex={10}
            // bg={"#eee"}
            size="sm"
            m={2}
            color="#555"
            display={videoUrl ? (ready ? "none" : "block") : "none"}
          />
          {selection.SelectionHalo}
        </Box>
      )} */}
    </CarbonBlock>
  );
}
