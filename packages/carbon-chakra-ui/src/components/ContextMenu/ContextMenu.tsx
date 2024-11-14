import { Box, BoxProps, Placement } from "@chakra-ui/react";
import { domRect } from "@emrgen/carbon-dragon";
import { ReactNode, useEffect, useRef, useState } from "react";

const width = 240;

interface ContextMenuProps {
  placementRef: HTMLElement | null;
  children: ReactNode[] | ReactNode;
  isOpen?: boolean;
  onClose?: () => void;
  onOpen?: () => void;
  placement?: Placement;
  align?: "center" | "start" | "end";
  trigger?: React.ReactNode;
  menu?: any;
  subMenu?: boolean;
}

export const ContextMenu = (props: ContextMenuProps) => {
  const {
    children,
    isOpen,
    placementRef,
    placement = "left",
    align = "start",
    subMenu = false,
  } = props;
  const [style, setStyle] = useState<BoxProps>({ left: "-1000px" });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!placementRef) {
      return;
    }

    if (!isOpen) {
      setStyle((s) => ({
        ...s,
        left: "-1000px",
      }));
      return;
    }

    setStyle(findPlacementPosition(placementRef, placement, align, subMenu));
    setTimeout(() => {}, 100);
  }, [align, placement, placementRef, isOpen, subMenu]);

  return (
    <Box
      ref={ref}
      pos={"absolute"}
      w={width + "px"}
      overflow={"hidden"}
      bg={"#fff"}
      opacity={isOpen ? 1 : 0}
      transition={"opacity 0.2s"}
      {...style}
      borderRadius={4}
      boxShadow={
        "rgba(15, 15, 15, 0.05) 0px 0px 0px 1px, rgba(15, 15, 15, 0.1) 0px 3px 6px, rgba(15, 15, 15, 0.2) 0px 9px 24px"
      }
      zIndex={1000}
      fontSize={"sm"}
    >
      {children}
    </Box>
  );
};

const findPlacementPosition = (
  el: HTMLElement,
  placement: Placement,
  align: ContextMenuProps["align"],
  subMenu: boolean,
) => {
  const rect = domRect(el);
  let left = rect.left;
  let top = rect.top;
  let transform = `translateX(0)`;

  console.log(placement);

  // by default place on the right of the element
  if (placement === "auto") {
  }

  if (placement === "left-start") {
    left -= subMenu ? 0 : 30;
    transform = `translateX(-100%)`; // move to left

    if (left - width < 0) {
      transform = `translateX(0)`; // move to right
      left = rect.left;
    } else if (left + width > window.innerWidth) {
      left = rect.right;
      transform = `translateX(-100%)`; // move to left
    }

    if (top < 0) {
      top = 10;
    }
  }

  if (placement === "right-start") {
    left = rect.right + (subMenu ? 0 : 10);
    if (left + width > window.innerWidth) {
      left = rect.left;
      transform = `translateX(-100%)`; // move to left
      left -= subMenu ? 0 : 10;
    } else {
      transform = `translateX(0)`; // move to right
    }

    if (top < 0) {
      top = 10;
    }
  }

  return {
    top,
    left,
    transform,
  };
};

const menuHeight = (menu) => {
  const { items = [] } = menu;
  console.log(menu);
};
