import { HStack, StackProps } from "@chakra-ui/react";
import { ReactNode } from "react";

interface ContextMenuItemProps extends StackProps {
  children: ReactNode | ReactNode[];
}
export const ContextMenuItem = (props: ContextMenuItemProps) => {
  const { children, ...rest } = props;

  return (
    <HStack
      px={2}
      h={"25px"}
      alignItems={"center"}
      cursor={"pointer"}
      userSelect={"none"}
      {...rest}
    >
      {children}
    </HStack>
  );
};