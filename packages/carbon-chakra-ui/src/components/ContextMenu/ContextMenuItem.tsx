import { Box, HStack, StackProps, Text } from "@chakra-ui/react";
import { isEmpty, merge } from "lodash";
import { ReactNode, useCallback, useMemo, useRef } from "react";
import { MdKeyboardArrowRight } from "react-icons/md";
import { useContextMenu } from "./useContextMenu";

interface ContextMenuItemProps extends StackProps {
  item: any;
  shortcut?: string;
  children: ReactNode | ReactNode[];
  subMenu?: ReactNode;
  depth?: number;
}
export const ContextMenuItem = (props: ContextMenuItemProps) => {
  const { children, item, ...rest } = props;
  const ref = useRef<HTMLElement>(null);
  const menu = useContextMenu();

  const style = useMemo(() => {
    return merge(rest, {
      px: 1,
      h: "28px",
      cursor: "pointer",
      userSelect: "none",
      ...(item.style ?? {}),
    });
  }, [item, rest]);

  const showChildItems = useCallback(() => {
    if (!ref.current) {
      return;
    }

    const { stack, setStack } = menu;

    if (stack.length && stack[stack.length - 1]?.item.id === item.id) {
      return;
    }

    // pop all items at same depth or higher
    while (stack.length && stack[stack.length - 1].item.depth >= item.depth) {
      stack.pop();
    }
    console.log(item);
    setStack([...stack, { item, parent: ref.current }]);
  }, [item, menu]);

  return (
    <>
      <Box
        {...style}
        ref={ref}
        className={"menu-item"}
        onMouseOver={showChildItems}
      >
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
            fontSize={"12px"}
          >
            {item.shortcut ?? ""}
            {!isEmpty(item.items) && <MdKeyboardArrowRight fontSize={"16px"} />}
          </Text>
        </HStack>
      </Box>
    </>
  );
};