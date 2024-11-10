import {
  Box,
  Button,
  Input,
  Spinner,
  Stack,
  useDisclosure,
} from "@chakra-ui/react";
import { stop, StylePath } from "@emrgen/carbon-core";
import { VideoSrcPath } from "@emrgen/carbon-media";
import {
  CarbonBlock,
  RendererProps,
  useCarbon,
  useCarbonOverlay,
  useSelectionHalo,
} from "@emrgen/carbon-react";
import { Form, Formik } from "formik";
import { CSSProperties, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import ReactPlayer from "react-player";
import { normalizeSizeStyle } from "../../utils";

import { ResizableContainer } from "../ResizableContainer";

export function VideoComp(props: RendererProps) {
  const { node } = props;

  return (
    <CarbonBlock {...props}>
      <VideoContent node={node} />
    </CarbonBlock>
  );
}

const VideoContent = (props: RendererProps) => {
  const { node } = props;
  const app = useCarbon();
  const updater = useDisclosure();
  const [style, setStyle] = useState<CSSProperties>(() =>
    node.props.get<CSSProperties>(StylePath, {}),
  );
  const { ref: overlayRef } = useCarbonOverlay();

  const boundRef = useRef<any>(null);
  const [height, setHeight] = useState(style.height);
  const [ready, setReady] = useState(false);
  const videoUrl = node.props.get(VideoSrcPath, "");

  const selection = useSelectionHalo(props);

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
            initialValues={{ url: videoUrl }}
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
    <ResizableContainer
      node={node}
      enable={ready}
      aspectRatio={1}
      render={({ width, height }) => {
        console.log("width", width, "height", height);
        return (
          <CarbonVideoPlayer
            src={videoUrl}
            ready={ready}
            setReady={setReady}
            height={height ?? width * (9 / 16)}
          />
        );
      }}
    ></ResizableContainer>
  );
};

interface CarbonVideoPlayerProps {
  src: string;
  ready: boolean;
  height: number | string;
  setReady: (ready: boolean) => void;
}

const CarbonVideoPlayer = (props: CarbonVideoPlayerProps) => {
  const { src, setReady, ready, height } = props;

  return (
    <Box w={"full"} h={height} bg={"#eee"}>
      <CarbonVideoLoading ready={ready} />
      <ReactPlayer
        onReady={() => {
          setReady(true);
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

/*
*
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
      )} */