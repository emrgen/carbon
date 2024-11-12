import { Box, HStack, StackProps, Text } from "@chakra-ui/react";
import { merge } from "lodash";
import { ReactNode, useMemo, useRef } from "react";

interface ContextMenuItemProps extends StackProps {
  item: any;
  shortcut?: string;
  children: ReactNode | ReactNode[];
  subMenu?: ReactNode;
  depth?: number;
}
export const ContextMenuItem = (props: ContextMenuItemProps) => {
  const { children, subMenu, item, ...rest } = props;
  const ref = useRef<HTMLElement>(null);

  const style = useMemo(() => {
    return merge(rest, {
      px: 1,
      h: "28px",
      cursor: "pointer",
      userSelect: "none",
      ...(item.style ?? {}),
    });
  }, [item, rest]);

  return (
    <>
      <Box {...style} ref={ref} className={"menu-item"}>
        <HStack
          h={"full"}
          px={2}
          _hover={{
            background: "gray.100",
          }}
          alignItems={"center"}
          borderRadius={4}
        >
          <HStack flex={1} spacing={3}>
            {children}
          </HStack>
          <Text
            color={"#aaa"}
            fontFamily={"Geist Mono, monospace"}
            fontSize={"13px"}
          >
            {item.shortcut ?? ""}
          </Text>
        </HStack>
      </Box>
    </>
  );
};