import {
  Box,
  Button,
  Center,
  Flex,
  Input,
  Spinner,
  Square,
  Stack,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { prevent, preventAndStop, stop } from "@emrgen/carbon-core";
import { useRectSelectable } from "@emrgen/carbon-dragon-react";
import { ImageSrcPath } from "@emrgen/carbon-media";
import {
  CarbonBlock,
  RendererProps,
  useCarbon,
  useCarbonOverlay,
  useNodeChange,
  useSelectionHalo,
} from "@emrgen/carbon-react";
import { Form, Formik } from "formik";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { RxImage } from "react-icons/rx";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { ResizableContainer } from "../ResizableContainer";

const CaptionPath = "remote/state/caption";

export function ImageComp(props: RendererProps) {
  const { node } = props;

  return (
    <>
      <CarbonBlock {...props}>
        <ImageContent node={node} />
      </CarbonBlock>
    </>
  );
}

const ImageProps = (props: RendererProps) => {
  const { node } = props;
  const ref = useRef<HTMLDivElement>(null);
  const { node: linkNode } = useNodeChange({
    node: node.links["props"]!,
  });

  const { SelectionHalo, attributes } = useSelectionHalo({
    node: linkNode,
    parentSelectionCheck: false,
  });

  useRectSelectable({ ref, node: linkNode });

  return (
    <CarbonBlock
      node={linkNode}
      ref={ref}
      custom={{ ...attributes, ...props.custom }}
    >
      {SelectionHalo}
    </CarbonBlock>
  );
};

const ImageContent = (props: RendererProps) => {
  const { node } = props;
  const app = useCarbon();
  // const [style, setStyle] = useState<CSSProperties>(() =>
  //   node.props.get<CSSProperties>(StylePath, {}),
  // );

  const [ready, setReady] = useState(false);
  const caption = node.props.get(CaptionPath, "");
  const imageSrc = node.props.get(ImageSrcPath, "");
  const ref = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const boundRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const updater = useDisclosure();
  const {
    ref: overlayRef,
    showOverlay,
    hideOverlay,
    overlay,
  } = useCarbonOverlay();

  useEffect(() => {
    const onHide = () => {
      updater.onClose();
    };
    overlay.on("hide", onHide);
    return () => {
      overlay.off("hide", onHide);
    };
  }, [overlay, updater]);

  const updateImage = useImageUrlUpdate({
    app,
    overlayRef,
    boundRef,
    node,
    updater,
    hideOverlay,
  });

  // const selection = useSelectionHalo(props);
  const [aspectRatio, setAspectRatio] = useState(9 / 16);

  // const handleClick = (e) => {
  //   preventAndStop(e);
  //
  //   app.emit(
  //     "show:options:menu",
  //     node.id,
  //     ref.current?.getBoundingClientRect(),
  //   );
  // };

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

  useEffect(() => {
    if (!imageRef.current) return;
    const { width, height } = imageRef.current;
    setAspectRatio(height / width);
  }, [app, imageRef, node]);

  useEffect(() => {
    return () => {
      console.log("unmounted image");
    };
  }, []);

  return (
    <>
      <ResizableContainer node={node} enable={ready} aspectRatio={aspectRatio}>
        {!imageSrc && (
          <CarbonImageEmpty
            src={imageSrc}
            ready={ready}
            setReady={setReady}
            onClick={() => {
              updater.onOpen();
              showOverlay(node.id.toString());
            }}
          />
        )}
        {imageSrc && (
          // <Image loading="lazy" src={imageSrc} />
          <CarbonLazyImage src={imageSrc} ready={ready} setReady={setReady} />
        )}
      </ResizableContainer>
      {!imageSrc && (
        <Box
          ref={boundRef}
          pos={"absolute"}
          top={0}
          w={"full"}
          h="full"
          zIndex={-1}
        />
      )}
      {updateImage}
      <ImageProps
        node={node}
        custom={{
          onClick: (e) => {
            stop(e);
            if (!imageSrc) {
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

interface CarbonLazyImageProps {
  src: string;
  ready: boolean;
  setReady: (ready: boolean) => void;
  onClick?: (e: React.MouseEvent) => void;
}

const CarbonImageEmpty = (props: CarbonLazyImageProps) => {
  return (
    <Flex
      pos={"absolute"}
      className="image-overlay"
      onClick={(e) => {
        console.log(e);
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
        <RxImage />
      </Square>
      <Text>Click to add image</Text>
    </Flex>
  );
};

const CarbonLazyImage = (props: CarbonLazyImageProps) => {
  const { src, setReady, ready } = props;

  return (
    <>
      <LazyLoadImage
        src={src}
        alt=""
        onLoad={(e) => {
          setReady(true);
          console.log(e);
        }}
        onMouseDown={prevent}
        placeholder={<Center color="#aaa">Image loading...</Center>}
      />
      {!ready && (
        <Spinner
          pos={"absolute"}
          bottom={0}
          right={0}
          zIndex={10}
          size="sm"
          m={2}
          color="#555"
          display={src ? (ready ? "block" : "block") : "none"}
        />
      )}
    </>
  );
};

const useImageUrlUpdate = ({
  app,
  overlayRef,
  boundRef,
  node,
  updater,
  hideOverlay,
}) => {
  const formRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (formRef.current) {
      formRef.current.focus();
    }
  }, [formRef, updater]);

  if (!overlayRef.current) return null;
  if (!boundRef.current) return null;
  const { left, top, width, height } =
    boundRef.current?.getBoundingClientRect();

  return createPortal(
    <Box
      className={"image-updater"}
      pos={"absolute"}
      w={width + "px"}
      h={height + "px"}
      left={left}
      top={top}
      zIndex={1000}
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
        boxShadow={
          "rgba(15, 15, 15, 0.05) 0px 0px 0px 1px, rgba(15, 15, 15, 0.1) 0px 3px 6px, rgba(15, 15, 15, 0.2) 0px 9px 24px"
        }
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
              hideOverlay();
              actions.setSubmitting(false);
              app.cmd
                .Update(node.id, {
                  [ImageSrcPath]: values.src,
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
};

interface CarbonImageEmptyProps {
  onClick?: (e: React.MouseEvent) => void;
}