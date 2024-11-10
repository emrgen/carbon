import { Flex } from "@chakra-ui/react";
import { clamp, Node, StylePath } from "@emrgen/carbon-core";

import { DndEvent } from "@emrgen/carbon-dragon";
import { useDndMonitor, useDraggableHandle } from "@emrgen/carbon-dragon-react";
import { RendererProps, useCarbon } from "@emrgen/carbon-react";
import { useDocument } from "@emrgen/carbon-react-blocks";
import React, {
  CSSProperties,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import useResizeObserver from "use-resize-observer";
import { normalizeSizeStyle } from "../utils";

interface MediaViewProps extends RendererProps {
  minWidth?: number;
  minHeight?: number;
  aspectRatio?: number;
  enable?: boolean;
  render?: (props: { width: number; height?: number }) => React.ReactNode;
}

const roundInOffset = (size: number, offset: number) => {
  return Math.round(size / offset) * offset;
};

const snapValue = (
  value: number,
  snapTo: number,
  minOffset: number,
  maxOffset: number,
) => {
  if (snapTo + minOffset < value && value < snapTo + maxOffset) {
    return snapTo;
  }

  return value;
};

const getStyle = (node: Node) => {
  return node.props.get<CSSProperties>(StylePath, {});
};

export const ResizableContainer = (props: MediaViewProps) => {
  const {
    node,
    enable,
    aspectRatio = 0.681944444,
    minHeight = 100,
    minWidth,
  } = props;
  const app = useCarbon();
  const { doc } = useDocument();

  const { ref: resizeObserverRef, ...dimensions } =
    useResizeObserver<HTMLDivElement>();
  const ref = useRef<HTMLDivElement>(null);

  const [style, setStyle] = useState<CSSProperties>(() => getStyle(node));
  const [width, setWidth] = useState(style.width ?? "full");
  const [height, setHeight] = useState(style.height ?? "auto");
  const [documentWidth, setDocumentWidth] = useState(1000);
  const [documentPadding, setDocumentPadding] = useState(0);
  const [fullWidth, setFullWidth] = useState(false);

  const [opacity, setOpacity] = React.useState(0);
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const leftHandle = useDraggableHandle({
    node,
    ref: leftRef,
    id: "media-left-resizer",
  });
  const rightHandle = useDraggableHandle({
    node,
    ref: rightRef,
    id: "media-right-resizer",
  });
  const bottomHandle = useDraggableHandle({
    node,
    ref: bottomRef,
    id: "media-bottom-resizer",
  });

  useEffect(() => {
    resizeObserverRef(ref.current);
  }, [resizeObserverRef, ref]);

  const updateDocumentWidth = useCallback(() => {
    const document = node.parents.find((n) => n.isDocument);
    if (!document) return;
    const docEl = app.store.element(document.id);
    if (!docEl) return;
    const parentWidth = docEl.getBoundingClientRect().width;
    const { paddingLeft } = window.getComputedStyle(docEl);

    setDocumentPadding(parseInt(paddingLeft.toString()));
    setDocumentWidth(parentWidth);
    if (fullWidth) {
      setWidth(parentWidth);
    }
  }, [app.store, fullWidth, node]);

  useEffect(() => {
    app.on("document:mounted", updateDocumentWidth);
    return () => {
      app.off("document:mounted", updateDocumentWidth);
    };
  }, [app, updateDocumentWidth]);

  useEffect(() => {
    window.addEventListener("resize", updateDocumentWidth);
    return () => {
      window.removeEventListener("resize", updateDocumentWidth);
    };
  }, [updateDocumentWidth]);

  const onDragStart = useCallback(
    (e: DndEvent) => {
      const { setInitState } = e;
      setInitState({
        width: ref?.current?.offsetWidth ?? 0,
        height: ref?.current?.offsetHeight ?? 0,
      });
    },
    [ref],
  );

  const onDragMove = useCallback(
    (e: DndEvent) => {
      if (!node.id.eq(e.node.id)) return;
      const { position, initState, prevState, setPrevState } = e;
      const { width, height } = initState;
      const { width: pw, height: ph } = prevState;
      const { deltaX: dx, deltaY: dy } = position;
      let nw = width;
      let nh = height;

      // console.log("dx", dx, "dy", dy, documentWidth, width, height);

      if (e.id === "media-left-resizer") {
        console.log("left resizer", dx, width, documentWidth, documentPadding);
        nw = clamp(roundInOffset(width - 2 * dx, 50), 100, documentWidth);
        nw = snapValue(nw, documentWidth - 2 * documentPadding, -30, 30);
        nw = snapValue(nw, documentWidth, -60, 10);
        if (nw === pw) return;

        setWidth(nw);
        setHeight(nw * aspectRatio);
      } else if (e.id === "media-right-resizer") {
        nw = clamp(roundInOffset(width + 2 * dx, 50), 100, documentWidth);
        nw = snapValue(nw, documentWidth - 2 * documentPadding, -30, 30);
        nw = snapValue(nw, documentWidth, -30, 10);
        if (nw === pw) return;

        if (nw === documentWidth - 2 * documentPadding) {
          setWidth("full");
          setHeight("auto");
        } else if (nw === documentWidth) {
          setWidth(nw);
          setHeight(360);
        } else {
          setWidth(nw);
          setHeight("auto");
        }
        setFullWidth(nw === documentWidth);
      } else if (e.id === "media-bottom-resizer") {
        nh = clamp(roundInOffset(height + dy, 50), 100, aspectRatio * width);
        setHeight(nh);
      }

      setPrevState({ width: nw, height: nh });
    },
    [aspectRatio, documentPadding, documentWidth, node.id],
  );

  const onDragEnd = useCallback(
    (e: DndEvent) => {
      if (!node.id.eq(e.node.id)) return;
      app.cmd
        .Update(node.id, {
          node: { width, height },
        })
        .Dispatch();
    },
    [app, height, node.id, width],
  );

  useDndMonitor({
    onDragStart,
    onDragMove,
    onDragEnd,
  });

  return (
    <Flex
      className={"resizable-container"}
      ref={ref}
      position={"relative"}
      left={"50%"}
      transform={"translateX(-50%)"}
      width={normalizeSizeStyle(width)}
      height={normalizeSizeStyle(height)}
      maxW={normalizeSizeStyle(documentWidth)}
      minH={minHeight + "px"}
      maxH={documentWidth ? documentWidth * aspectRatio + "px" : "full"}
      transition={"width 0.3s, height 0.3s"}
      borderRadius={4}
      overflow={"hidden"}
      onMouseOver={() => setOpacity(1)}
      onMouseLeave={() => setOpacity(0)}
    >
      <Flex
        pos={"relative"}
        h={"full"}
        w={"full"}
        flex={1}
        alignItems={width === documentWidth ? "center" : "auto"}
      >
        {props.render &&
          dimensions?.width &&
          props.render({
            width: dimensions.width,
            height: height === "auto" ? undefined : dimensions.height,
          })}
        {props.children}
        {enable && (
          <>
            <Flex
              ref={leftRef}
              pos={"absolute"}
              top={"50%"}
              left={2}
              h={"50px"}
              w={"6px"}
              bg={"rgba(0,0,0,0.5)"}
              borderRadius={4}
              transform={"translate(0, -50%)"}
              cursor={"ew-resize"}
              border={"1px solid rgba(255,255,255,0.8)"}
              opacity={opacity ? 1 : 0}
              transition={"opacity 0.2s ease-in-out"}
              {...leftHandle.listeners}
              {...leftHandle.attributes}
            />
            <Flex
              ref={rightRef}
              pos={"absolute"}
              top={"50%"}
              right={2}
              h={"50px"}
              w={"6px"}
              bg={"rgba(0,0,0,0.8)"}
              borderRadius={4}
              transform={"translate(0, -50%)"}
              cursor={"ew-resize"}
              border={"1px solid rgba(255,255,255,0.8)"}
              opacity={opacity ? 1 : 0}
              transition={"opacity 0.2s ease-in-out"}
              {...rightHandle.listeners}
              {...rightHandle.attributes}
            />
            {documentWidth === width && (
              <Flex
                ref={bottomRef}
                pos={"absolute"}
                bottom={2}
                left={"50%"}
                w={"50px"}
                h={"6px"}
                bg={"rgba(0,0,0,0.5)"}
                borderRadius={4}
                transform={"translate(-50%,0)"}
                cursor={"ns-resize"}
                border={"1px solid rgba(255,255,255,0.8)"}
                opacity={opacity ? 1 : 0}
                transition={"opacity 0.2s ease-in-out"}
                {...bottomHandle.listeners}
                {...bottomHandle.attributes}
              />
            )}
          </>
        )}
      </Flex>
    </Flex>
  );
};