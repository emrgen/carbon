import { Stack } from "@chakra-ui/react";
import { ReactNode } from "react";

interface ContextMenuGroupProps {
  children: ReactNode | ReactNode[];
}

export const ContextMenuGroup = (props: ContextMenuGroupProps) => {
  const { children } = props;

  return (
    <Stack borderBottom={"1px solid #eee"} py={2} spacing={0}>
      {children}
    </Stack>
  );
};