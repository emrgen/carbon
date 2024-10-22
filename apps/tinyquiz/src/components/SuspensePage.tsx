import {Suspense} from "react";
import {Box, Progress} from "@chakra-ui/react";

export const SuspensePage = ({children}) => {
  return (
    <Suspense fallback={<Box w={'full'}><Progress w={'full'} top={0} h={1} isIndeterminate/></Box>}>
      {children}
    </Suspense>
  )
}