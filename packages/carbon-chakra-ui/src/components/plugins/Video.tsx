import {
  Box,
  Button,
  Flex,
  Input,
  Spinner,
  Square,
  Stack,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { stop, StylePath } from "@emrgen/carbon-core";
import { useRectSelectable } from "@emrgen/carbon-dragon-react";
import { VideoSrcPath } from "@emrgen/carbon-media";
import {
  CarbonBlock,
  RendererProps,
  useCarbon,
  useCarbonOverlay,
  useNodeChange,
  useSelectionHalo,
} from "@emrgen/carbon-react";
import { Form, Formik } from "formik";
import { CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { RxVideo } from "react-icons/rx";
import ReactPlayer from "react-player";
import { normalizeSizeStyle } from "../../utils";
import { ResizableContainer } from "../ResizableContainer";

export function VideoComp(props: RendererProps) {
  const { node } = props;

  return (
    <CarbonBlock node={node}>
      <VideoContent node={node} />
    </CarbonBlock>
  );
}

const VideoProps = (props: RendererProps) => {
  const { node } = props;
  const ref = useRef<HTMLDivElement>(null);

  const { SelectionHalo, attributes } = useSelectionHalo({
    node,
    parentSelectionCheck: false,
  });

  useRectSelectable({ ref, node });

  return (
    <>
      <CarbonBlock
        node={node}
        ref={ref}
        custom={{ ...attributes, ...props.custom }}
      >
        {SelectionHalo}
      </CarbonBlock>
    </>
  );
};

const VideoContent = (props: RendererProps) => {
  const { node } = useNodeChange({ node: props.node.linkedProps! });
  const app = useCarbon();
  const updater = useDisclosure();
  const [style, setStyle] = useState<CSSProperties>(() =>
    node.props.get<CSSProperties>(StylePath, {}),
  );
  const {
    ref: overlayRef,
    showOverlay,
    hideOverlay,
    overlay,
  } = useCarbonOverlay();

  const boundRef = useRef<any>(null);
  const formRef = useRef<any>(null);
  const [height, setHeight] = useState(style.height);
  const [ready, setReady] = useState(false);
  const videoUrl = node.props.get(VideoSrcPath, "");

  useEffect(() => {
    const onHide = () => {
      updater.onClose();
    };
    overlay.on("hide", onHide);
    return () => {
      overlay.off("hide", onHide);
    };
  }, [overlay, updater]);

  useEffect(() => {
    if (formRef.current) {
      formRef.current.focus();
    }
  }, [formRef, updater]);

  const updatePopover = useMemo(() => {
    if (!overlayRef.current) return null;
    if (!boundRef.current) return null;
    if (!updater.isOpen) return null;

    const { left, top, width, height } =
      boundRef.current?.getBoundingClientRect();

    return createPortal(
      <Box
        pos={"absolute"}
        w={width}
        h={height}
        left={left}
        top={top}
        display={updater.isOpen ? "block" : "none"}
      >
        <Box
          contentEditable={false}
          suppressContentEditableWarning
          pos={"absolute"}
          top={"100%"}
          left={"50%"}
          bg="white"
          transform={"translate(-50%,0)"}
          boxShadow={"0 0 10px 0 #aaa"}
          borderRadius={6}
          p={4}
          zIndex={100}
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
            initialValues={{ url: videoUrl }}
            onSubmit={(values, actions) => {
              const { url } = values;
              if (!url) {
                actions.setSubmitting(false);
                return;
              }

              console.log("values", values, actions);
              actions.setSubmitting(true);
              console.log("submit", values.url);

              setTimeout(() => {
                updater.onClose();
                hideOverlay();
                actions.setSubmitting(false);
                app.cmd
                  .Update(node.id, {
                    [VideoSrcPath]: values.url,
                    // {
                    //       url: values.url,
                    //       height: boundRef.current?.offsetWidth * (9 / 16),
                    //     },
                    //     [VideoSrcPath]: values.url,
                  })
                  .Dispatch();
              }, 1000);
            }}
          >
            {({ values, handleChange, isSubmitting }) => (
              <Form>
                <Stack w={300} spacing={4}>
                  <Input
                    ref={formRef}
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
  }, [overlayRef, videoUrl, updater, hideOverlay, app, node, formRef]);

  return (
    <>
      <ResizableContainer
        node={node}
        enable={ready}
        aspectRatio={9 / 16}
        render={({ width, height }) => {
          if (!videoUrl) {
            return (
              <CarbonVideoEmpty
                onClick={() => {
                  updater.onOpen();
                  showOverlay(node.id.toString());
                }}
              />
            );
          }

          return (
            <CarbonVideoPlayer
              src={videoUrl}
              ready={ready}
              setReady={setReady}
              height={width * (9 / 16)}
            />
          );
        }}
      >
        {/*<CarbonVideoPlayer*/}
        {/*  src={videoUrl}*/}
        {/*  ready={true}*/}
        {/*  setReady={setReady}*/}
        {/*  height={720 * (9 / 16)}*/}
        {/*/>*/}
      </ResizableContainer>

      {!videoUrl && (
        <Box
          ref={boundRef}
          pos={"absolute"}
          top={0}
          w={"full"}
          h="full"
          zIndex={-1}
          bg={"red"}
        />
      )}
      {updater.isOpen && updatePopover}
      <VideoProps
        node={node}
        custom={{
          onClick: (e) => {
            stop(e);
            console.log("xxxxxxxxxx");
            if (!videoUrl) {
              console.log("xxxxxxxxxxxxxxxxxxx");
              showOverlay(node.id.toString());
              updater.onOpen();
            }
            app.cmd.SelectBlocks([]).Dispatch();
          },
        }}
      />
    </>
  );
};

interface CarbonVideoPlayerProps {
  src: string;
  ready?: boolean;
  height?: number | string;
  setReady?: (ready: boolean) => void;
}

export const CarbonVideoPlayer = (props: CarbonVideoPlayerProps) => {
  const { src, setReady, ready, height } = props;
  const ref = useRef<HTMLDivElement>(null);

  return (
    <Box w={"full"} h={height} bg={"#eee"} ref={ref}>
      <CarbonVideoLoading ready={!!ready} />
      <ReactPlayer
        onReady={() => {
          setReady?.(true);
        }}
        url={src}
        controls
        width={"100%"}
        height={normalizeSizeStyle(height)}
        // get the length of the video
        // onDuration={(duration) => console.log("onDuration", duration)}
        // onProgress={throttle(
        //   (progress) => console.log("onProgress", progress),
        //   1000
        // )}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
        }}
        config={{
          youtube: {
            playerVars: {},
          },
        }}
      />
    </Box>
  );
};

interface CarbonVideoLoadingProps {
  ready: boolean;
}

const CarbonVideoLoading = (props: CarbonVideoLoadingProps) => {
  const { ready } = props;

  return (
    <Spinner
      pos={"absolute"}
      bottom={0}
      right={0}
      zIndex={10}
      // bg={"#eee"}
      size="sm"
      m={2}
      color="#555"
      display={ready ? "none" : "block"}
    />
  );
};

interface CarbonVideoEmptyProps {
  onClick?: (e: React.MouseEvent) => void;
}

const CarbonVideoEmpty = (props: CarbonVideoEmptyProps) => {
  return (
    <>
      <Flex
        className="image-overlay"
        onClick={(e) => {
          stop(e);
          props.onClick?.(e);
        }}
        h={"full"}
        w={"full"}
        minH={"inherit"}
        cursor={"pointer"}
        transition={"background 0.3s, color 0.3s"}
        _hover={{
          bg: "rgba(0,0,0,0.1)",
          color: "#999",
        }}
      >
        <Square size={12} borderRadius={4} fontSize={26} color={"#aaa"}>
          <RxVideo />
        </Square>
        <Text>Click to add video</Text>
      </Flex>
    </>
  );
};