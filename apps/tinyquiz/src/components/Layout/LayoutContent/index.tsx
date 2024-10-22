import { Box, StackProps } from "@chakra-ui/react";

interface LayoutContentProps extends StackProps {}


export function LayoutContent(props: LayoutContentProps) {
  const { children } = props;

  return (
    <Box w={'full'}>
      {children}
    </Box>
  );
}
