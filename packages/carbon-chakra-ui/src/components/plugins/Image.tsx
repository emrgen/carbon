import {
  Center,
  Flex,
  Image,
  Spinner,
  Square,
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
  useSelectionHalo,
} from "@emrgen/carbon-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { RxImage } from "react-icons/rx";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { ResizableContainer } from "../ResizableContainer";

const CaptionPath = "remote/state/caption";

export function ImageComp(props: RendererProps) {
  const { node } = props;
  const ref = useRef<HTMLDivElement>(null);
  const { SelectionHalo } = useSelectionHalo(props);
  useRectSelectable({ ref, node });

  return (
    <>
      <CarbonBlock {...props} ref={ref}>
        <ImageContent node={node} />
        {SelectionHalo}
      </CarbonBlock>
    </>
  );
}

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
  const { ref: overlayRef } = useCarbonOverlay();

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
      <ResizableContainer
        // width={style.width ?? 0}
        // height={style.height ?? 0}
        node={node}
        enable={true}
        aspectRatio={aspectRatio}
      >
        {!imageSrc && (
          <CarbonImageLoading
            src={imageSrc}
            ready={ready}
            setReady={setReady}
          />
        )}
        {imageSrc && (
          <Image loading="lazy" src={imageSrc} />
          // <CarbonLazyImage src={imageSrc} ready={ready} setReady={setReady} />
        )}
      </ResizableContainer>
    </>
  );
};

interface CarbonLazyImageProps {
  src: string;
  ready: boolean;
  setReady: (ready: boolean) => void;
}

const CarbonImageLoading = (props: CarbonLazyImageProps) => {
  return (
    <Flex
      className="image-overlay"
      onClick={(e) => {
        stop(e);
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

/*

const updatePopover = () => {
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
}

*/
