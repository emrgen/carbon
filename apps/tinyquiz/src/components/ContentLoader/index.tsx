import {Box, BoxProps, Center, Portal, Progress, Spinner} from "@chakra-ui/react";

export interface ContentLoaderProps extends BoxProps {
  isLoading?: boolean;
  isLoaded?: boolean;
  columnCount?: number;
}

export function ContentLoader(props: ContentLoaderProps) {
  const { isLoading,isLoaded, children } = props;
  return (
    <>
      {isLoading && !isLoaded && (
        <Center h="full" w="full" >
          <Spinner size="xl" />
        </Center>
      )}
      <Box h='full' w='full' opacity={isLoading ? 0 : 1} transition={'all 0.2s ease'}>{children}</Box>
    </>
  );
}

export const PageContentLoader = (props: ContentLoaderProps) => {
  const { isLoading, isLoaded , columnCount, children } = props;

  return (
    <>
      {isLoading && !isLoaded && (
        <Portal>
          <Box w={'full'} h={1} bg={'red'} pos={'absolute'}>
            <Progress size="xs" isIndeterminate />
          </Box>
        </Portal>
      )}
      {children}
    </>
  );
}
