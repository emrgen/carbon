import { Box } from "@chakra-ui/react";
import { ShowContextMenuEvent } from "@emrgen/carbon-blocks";
import { domRect } from "@emrgen/carbon-dragon";
import { useCarbon, useCarbonOverlay } from "@emrgen/carbon-react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

export const BlockContextMenu = () => {
  const app = useCarbon();
  const {
    overlay,
    showOverlay,
    hideOverlay,
    ref: overlayRef,
  } = useCarbonOverlay();
  const [show, setShow] = useState(false);
  const [anchorPosition, setAnchorPosition] = useState({ x: 0, y: 0 });
  const [style, setStyle] = useState({});

  // hide overlay on click outside the block context menu
  useEffect(() => {
    const onClickOverlay = (e: MouseEvent) => {
      setShow(false);
    };

    overlay.on("click", onClickOverlay);
    return () => {
      overlay.off("click", onClickOverlay);
    };
  }, [hideOverlay, overlay]);

  useEffect(() => {
    const showContextMenu = (e: ShowContextMenuEvent) => {
      const { node, event } = e;
      e.event.preventDefault();
      const el = app.store.element(node.id);
      if (!el) return;
      const rect = domRect(el);
      showOverlay();
      setAnchorPosition({
        x: rect.left,
        y: rect.top,
      });
      setStyle({
        top: rect.top,
        left: rect.left - 10,
        transform: `translateX(-100%)`,
      });
      // get the
      setShow(true);
    };

    app.on("show:context:menu", showContextMenu);
    return () => {
      app.off("show:context:menu", showContextMenu);
    };
  }, [app, showOverlay]);

  const ContextMenu = useMemo(() => {
    return (
      <Box
        className={"carbon-block-context-menu"}
        pos={"absolute"}
        w={100}
        h={100}
        bg={"red"}
        {...style}
        display={show ? "block" : "none"}
        zIndex={1000}
      >
        123123
      </Box>
    );
  }, [show, style]);

  return <>{createPortal(<>{ContextMenu}</>, document.body)}</>;
};