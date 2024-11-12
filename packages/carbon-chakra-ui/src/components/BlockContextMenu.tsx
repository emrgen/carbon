import { Text } from "@chakra-ui/react";
import { ShowContextMenuEvent } from "@emrgen/carbon-blocks";
import { domRect } from "@emrgen/carbon-dragon";
import { useCarbon, useCarbonOverlay } from "@emrgen/carbon-react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { BsTrash3 } from "react-icons/bs";
import { ContextMenu } from "./ContextMenu/ContextMenu";
import { ContextMenuGroup } from "./ContextMenu/ContextMenuGroup";
import { ContextMenuItem } from "./ContextMenu/ContextMenuItem";

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
  const [blockRef, setBlockRef] = useState<HTMLElement | null>(null);

  // hide overlay on click outside the block context menu
  useEffect(() => {
    const onClickOverlay = (e: MouseEvent) => {
      console.log("xxxxxxxxxxxxxxxx");
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
      setBlockRef(el);

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

  const contextMenu = useMemo(() => {
    return (
      <ContextMenu
        isOpen={show}
        placementRef={blockRef}
        placement={"left-start"}
        align={"start"}
      >
        <ContextMenuGroup>
          <ContextMenuItem _hover={{ color: "crimson" }}>
            <BsTrash3 />
            <Text>Delete</Text>
          </ContextMenuItem>
        </ContextMenuGroup>
        <ContextMenuGroup>
          <ContextMenuItem>
            <Text>123</Text>
          </ContextMenuItem>
          <ContextMenuItem>
            <Text>123</Text>
          </ContextMenuItem>
        </ContextMenuGroup>
        <ContextMenuGroup>
          <ContextMenuItem>
            <Text>123</Text>
          </ContextMenuItem>
          <ContextMenuItem>
            <Text>123</Text>
          </ContextMenuItem>
        </ContextMenuGroup>
      </ContextMenu>
    );
  }, [blockRef, show]);

  return <>{createPortal(<>{contextMenu}</>, document.body)}</>;
};