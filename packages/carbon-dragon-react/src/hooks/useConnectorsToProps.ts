import {useMemo} from "react";
import {NodeConnector} from "@emrgen/carbon-dragon";

export const useConnectorsToProps = (connector: NodeConnector) => {
  return useMemo(() => {
    return {...connector.listeners, ...connector.attributes}
  }, [connector]);
}
