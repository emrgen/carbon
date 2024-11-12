import {
  Box,
  Input,
  Placement,
  Portal,
  Text,
  usePrevious,
} from "@chakra-ui/react";
import { ShowContextMenuEvent } from "@emrgen/carbon-blocks";
import { domRect } from "@emrgen/carbon-dragon";
import { useCarbon, useCarbonOverlay } from "@emrgen/carbon-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { blockMenu } from "./blockOptions";
import { ContextMenu } from "./ContextMenu/ContextMenu";
import { ContextMenuGroup } from "./ContextMenu/ContextMenuGroup";
import { ContextMenuItem } from "./ContextMenu/ContextMenuItem";
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
      <ContextMenuContext>
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

interface ContextMenuNodeProps {
  isOpen: boolean;
  blockRef: HTMLElement | null;
  item: any;
  placement?: Placement;
  onSearch?: (text: string) => void;
  searchText?: string;
}

const ContextMenuNode = (props: ContextMenuNodeProps) => {
  const {
    isOpen,
    blockRef,
    item,
    placement = "auto",
    onSearch,
    searchText = "",
  } = props;
  const { type } = item;

  if (type === "menu") {
    return (
      <ContextMenu
        isOpen={isOpen}
        placementRef={blockRef}
        placement={placement}
        menu={item}
      >
        {item.items.map((item) => {
          return (
            <ContextMenuNode
              key={item.id}
              item={item}
              blockRef={null}
              isOpen={isOpen}
              onSearch={onSearch}
              searchText={searchText}
            />
          );
        })}
      </ContextMenu>
    );
  }

  if (type === "group") {
    return (
      <ContextMenuGroup>
        {item.items.map((item) => {
          return (
            <ContextMenuNode
              key={item.id}
              item={item}
              blockRef={null}
              isOpen={isOpen}
              onSearch={onSearch}
              searchText={searchText}
            />
          );
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

  if (type === "search") {
    return (
      <SearchMenu
        value={searchText}
        onChange={(v) => {
          console.log(v);
          onSearch?.(v);
        }}
        isOpen={isOpen}
      />
    );
  }

  return null;
};

interface SearchMenuProps {
  value: string;
  onChange: (value: string) => void;
  isOpen: boolean;
}

const SearchMenu = (props: SearchMenuProps) => {
  const { value, onChange, isOpen } = props;
  const ref = useRef<HTMLInputElement>(null);
  const prevIsOpen = usePrevious(isOpen);

  useEffect(() => {
    if (isOpen && !prevIsOpen) {
      ref.current?.focus();
    }
  }, [isOpen, prevIsOpen]);

  return (
    <Box px={2}>
      <Input
        ref={ref}
        size={"sm"}
        borderRadius={6}
        placeholder={"search actions"}
        _placeholder={{
          color: "#aaa",
        }}
        _focus={{
          _placeholder: { color: "#999" },
        }}
        onBeforeInput={(e) => {
          e.stopPropagation();
        }}
        onKeyDown={(e) => {
          e.stopPropagation();
        }}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
        }}
      />
    </Box>
  );
};
