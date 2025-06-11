import { Box, Input, Placement, Text, usePrevious } from "@chakra-ui/react";
import { useEffect, useRef } from "react";
import { ContextMenu } from "./ContextMenu";
import { ContextMenuGroup } from "./ContextMenuGroup";
import { ContextMenuItem } from "./ContextMenuItem";

interface ContextMenuNodeProps {
  isOpen: boolean;
  blockRef: HTMLElement | null;
  item: any;
  placement?: Placement;
  onSearch?: (text: string) => void;
  searchText?: string;
  subMenu?: boolean;
}

export const ContextMenuNode = (props: ContextMenuNodeProps) => {
  const {
    isOpen,
    blockRef,
    item,
    placement = "auto",
    onSearch,
    searchText = "",
    subMenu,
  } = props;
  const { type } = item;

  if (type === "menu") {
    return (
      <ContextMenu
        isOpen={isOpen}
        placementRef={blockRef}
        placement={placement}
        menu={item}
        subMenu={subMenu}
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
        {item.label && (
          <Text
            fontSize={"xs"}
            px={3}
            pb={1}
            color={"gray.500"}
            userSelect={"none"}
          >
            {item.label}
          </Text>
        )}

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
