import {Box, Flex, HStack, StackProps} from '@chakra-ui/react'
import {ReactNode} from "react";


interface LayoutProps extends StackProps {
  sidebar?: ReactNode;
}

export function Layout(props: LayoutProps) {
  return (
    <HStack w={'full'} h={'full'} spacing={0}>
      <Box h={'full'}>{props.sidebar}</Box>

      <Flex flex={1} h={'full'} w={'calc(100% - 200px)'} overflow={'auto'}>
        {props.children}
      </Flex>
    </HStack>
  )
}
