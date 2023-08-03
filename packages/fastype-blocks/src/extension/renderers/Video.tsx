import { useCallback, useEffect, useRef, useState } from "react";
import { Form, Formik } from "formik";

import { set, throttle } from "lodash";
import ReactPlayer from "react-player";
import {
  Box,
  Button,
  Flex,
  FormControl,
  IconButton,
  Input,
  Popover,
  PopoverContent,
  Skeleton,
  Spinner,
  Square,
  Stack,
  Text,
  useDimensions,
  useDisclosure,
} from "@chakra-ui/react";

import {
  CarbonBlock,
  RendererProps,
  preventAndStop,
  stop,
  useCarbon,
  useCarbonOverlay,
  useSelectionHalo,
} from "@emrgen/carbon-core";
import {
  useCombineConnectors,
  useConnectorsToProps,
  useDragDropRectSelect,
} from "@emrgen/carbon-dragon";

import { TbStatusChange } from "react-icons/tb";
import { useFastypeOverlay } from "../../hooks/useFastypeOverlay";
import { RxVideo } from "react-icons/rx";
import { MediaView } from "@emrgen/fastype-interact";

export function VideoComp(props: RendererProps) {
  const { node } = props;
  const app = useCarbon();
  const updater = useDisclosure();
  useFastypeOverlay(updater);

  const ref = useRef<any>(null);
  const containerRef = useRef<any>(null);
  const [height, setHeight] = useState(100);
  const { html, node: video } = node.attrs;
  const { provider, src } = video;
  const dimensions = useDimensions(containerRef, true);
  const [ready, setReady] = useState(false);

  const selection = useSelectionHalo(props);
  const dragDropRect = useDragDropRectSelect({ node, ref });
  const connectors = useConnectorsToProps(
    useCombineConnectors(dragDropRect, selection)
  );

  useEffect(() => {
    if (!ref.current) return;
    const width = dimensions?.contentBox.width ?? 150 * (9 / 16);
    setHeight(width * (9 / 16));
    // console.log(ref.current.offsetWidth);
  }, [dimensions]);

  const onClick = useCallback(
    (e) => {
      // preventAndStop(e);
      app.tr.selectNodes([]).dispatch();
    },
    [app.tr]
  );

  return (
    <>
      <CarbonBlock {...props} custom={{ ...connectors, onClick }} ref={ref}>
        {updater.isOpen && (
          <>
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
                initialValues={{
                  url: "",
                }}
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
                      .updateAttrs(node.id, {
                        node: {
                          url: values.url,
                        },
                      })
                      .dispatch();
                  }, 1000);
                }}
              >
                {(props) => (
                  <Form>
                    <Stack w={300} spacing={4}>
                      <Input
                        autoFocus
                        placeholder="Video URL"
                        size="sm"
                        id="url"
                        name="url"
                        autoComplete="off"
                        onChange={props.handleChange}
                      />
                      <Button
                        colorScheme="blue"
                        size="sm"
                        type="submit"
                        onMouseDown={stop}
                        onClick={stop}
                        isLoading={props.isSubmitting}
                      >
                        Update
                      </Button>
                    </Stack>
                  </Form>
                )}
              </Formik>
            </Box>
          </>
        )}

        <MediaView node={node} enable={ready} aspectRatio={9 / 16}>
          <Box
            className="video-container"
            pos={"relative"}
            ref={containerRef}
            bg={ready ? "" : "#eee"}
            h={node.attrs.node.url && !ready ? "100%" : "auto"}
          >
            <Box w="full">
              {!video.url && (
                <Flex
                  className="video-overlay"
                  onClick={() => {
                    updater.onOpen();
                  }}
                >
                  <Square
                    size={12}
                    borderRadius={4}
                    fontSize={26}
                    color={"#aaa"}
                  >
                    <RxVideo />
                  </Square>
                  <Text>Click to add video</Text>
                </Flex>
              )}
              {video.url && (
                <Box pos={"relative"} paddingTop={"56.25%"}>
                  <Box pos={"absolute"} top={0} w="full" h="full" bg="#eee">
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
                      url={video.url}
                      controls
                      width={"100%"}
                      height={"100%"}
                      // get the length of the video
                      onDuration={(duration) =>
                        console.log("onDuration", duration)
                      }
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
                  </Box>
                </Box>
              )}
              <Spinner
                pos={"absolute"}
                bottom={0}
                right={0}
                zIndex={10}
                // bg={"#eee"}
                size="sm"
                m={2}
                color="#555"
                display={video.url ? (ready ? "none" : "block") : "none"}
              />
              {selection.SelectionHalo}
            </Box>
          </Box>
        </MediaView>
      </CarbonBlock>
    </>
  );
}
