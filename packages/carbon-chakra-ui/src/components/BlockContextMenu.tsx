import { Placement, Text } from "@chakra-ui/react";
import { ShowContextMenuEvent } from "@emrgen/carbon-blocks";
import { domRect } from "@emrgen/carbon-dragon";
import { useCarbon, useCarbonOverlay } from "@emrgen/carbon-react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { blockMenu } from "./blockOptions";
import { ContextMenu } from "./ContextMenu/ContextMenu";
import { ContextMenuGroup } from "./ContextMenu/ContextMenuGroup";
import { ContextMenuItem } from "./ContextMenu/ContextMenuItem";
import { ContextMenuContext } from "./ContextMenu/useContextMenu";

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
  const [blockRef, setBlockRef] = useState<HTMLElement | null>(null);
  const [placement, setPlacement] = useState<Placement>("auto");

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
      const { node, event, placement } = e;
      e.event.preventDefault();
      const el = app.store.element(node.id);
      if (!el) return;
      const rect = domRect(el);

      setPlacement(placement);
      setBlockRef(el);
      showOverlay();
      setAnchorPosition({
        x: rect.left,
        y: rect.top,
      });
      setShow(true);
    };

    app.on("show:context:menu", showContextMenu);
    return () => {
      app.off("show:context:menu", showContextMenu);
    };
  }, [app, showOverlay]);

  const contextMenu = useMemo(() => {
    return (
      <ContextMenuContext>
        <ContextMenuNode
          show={show}
          blockRef={blockRef}
          item={blockMenu}
          placement={placement}
        />
      </ContextMenuContext>
    );
  }, [blockRef, placement, show]);

  return (
    <>
      {overlayRef.current &&
        createPortal(<>{contextMenu}</>, overlayRef.current!)}
    </>
  );
};

interface ContextMenuNodeProps {
  show?: boolean;
  blockRef: HTMLElement | null;
  item: any;
  placement?: Placement;
}

const ContextMenuNode = (props: ContextMenuNodeProps) => {
  const { show, blockRef, item, placement = "auto" } = props;
  const { type } = item;

  if (type === "menu") {
    return (
      <ContextMenu isOpen={show} placementRef={blockRef} placement={placement}>
        {item.items.map((item) => {
          return <ContextMenuNode key={item.id} item={item} blockRef={null} />;
        })}
      </ContextMenu>
    );
  }

  if (type === "group") {
    return (
      <ContextMenuGroup>
        {item.items.map((item) => {
          return <ContextMenuNode key={item.id} item={item} blockRef={null} />;
        })}
      </ContextMenuGroup>
    );
  }

  if (type === "option") {
    return (
      <ContextMenuItem item={item} shortcut={item.shortcut}>
        {item.icon}
        <Text>{item.label}</Text>
      </ContextMenuItem>
    );
  }

  return null;
};
