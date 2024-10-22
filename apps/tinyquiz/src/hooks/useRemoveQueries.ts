import {useQueryClient} from "@tanstack/react-query";
import {usePrevious} from "@chakra-ui/react";
import {useEffect} from "react";
import {isEqual} from "lodash";

export const useRemoveQueries = (keys: string[]) => {
  const queryClient = useQueryClient();
  const previous = usePrevious(keys);

  useEffect(() => {
    if (previous && !isEqual(keys, previous)) {
      queryClient.removeQueries({
        queryKey: [previous.toString()],
      });
    }
  }, [previous]);
}