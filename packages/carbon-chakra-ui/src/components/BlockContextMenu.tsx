import { Placement, Portal } from "@chakra-ui/react";
import { ShowContextMenuEvent } from "@emrgen/carbon-blocks";
import { domRect } from "@emrgen/carbon-dragon";
import { useCarbon, useCarbonOverlay } from "@emrgen/carbon-react";
import { useEffect, useMemo, useState } from "react";
import { blockMenu } from "./blockOptions";
import { ContextMenuNode } from "./ContextMenu/ContextMenuNode";
import { filterMenu } from "./ContextMenu/filterMenu";
import { ContextMenuContext } from "./ContextMenu/useContextMenu";

export const BlockContextMenu = () => {
  const app = useCarbon();
  const {
    overlay,
    showOverlay,
    hideOverlay,
    ref: overlayRef,
  } = useCarbonOverlay();
  const [isOpen, setIsOpen] = useState(false);
  const [anchorPosition, setAnchorPosition] = useState({ x: 0, y: 0 });
  const [blockRef, setBlockRef] = useState<HTMLElement | null>(null);
  const [placement, setPlacement] = useState<Placement>("auto");
  const [searchText, setSearchText] = useState("");

  // hide overlay on click outside the block context menu
  useEffect(() => {
    const onClickOverlay = (e: MouseEvent) => {
      setIsOpen(false);
      setSearchText("");
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
      setIsOpen(true);
    };

    app.on("show:context:menu", showContextMenu);
    return () => {
      app.off("show:context:menu", showContextMenu);
    };
  }, [app, showOverlay]);

  const filteredMenu = useMemo(() => {
    if (!searchText) return blockMenu;
    return filterMenu(blockMenu, searchText.toLowerCase());
  }, [searchText]);

  const contextMenu = useMemo(() => {
    return (
      <ContextMenuContext isOpen={isOpen} showSubMenu={!searchText}>
        <ContextMenuNode
          isOpen={isOpen}
          blockRef={blockRef}
          item={filteredMenu}
          placement={placement}
          searchText={searchText}
          onSearch={setSearchText}
        />
      </ContextMenuContext>
    );
  }, [blockRef, filteredMenu, placement, searchText, isOpen]);

  return (
    <Portal containerRef={overlayRef}>
      {overlayRef.current && contextMenu}
    </Portal>
  );
};
