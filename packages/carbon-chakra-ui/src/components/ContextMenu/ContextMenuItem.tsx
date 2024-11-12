import { Box, HStack, StackProps } from "@chakra-ui/react";
import { merge } from "lodash";
import { ReactNode, useMemo, useRef } from "react";

interface ContextMenuItemProps extends StackProps {
  item: any;
  children: ReactNode | ReactNode[];
  subMenu?: ReactNode;
  depth?: number;
}
export const ContextMenuItem = (props: ContextMenuItemProps) => {
  const { children, subMenu, ...rest } = props;
  const ref = useRef<HTMLElement>(null);

  const style = useMemo(() => {
    return merge(rest, {
      px: 1,
      h: "28px",
      cursor: "pointer",
      userSelect: "none",
    });
  }, [rest]);

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
          {children}
        </HStack>
      </Box>
    </>
  );
};