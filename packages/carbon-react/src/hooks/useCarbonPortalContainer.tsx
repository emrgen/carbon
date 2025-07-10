import {Optional} from "@emrgen/types";
import {createContext, useContext} from "react";

const InnerCarbonPortalContext = createContext<Optional<HTMLDivElement>>(null);

export const useCarbonPortalContainer = () => {
  return useContext(InnerCarbonPortalContext);
}

export const CarbonPortalContainerProvider = ({ container, children }) => {
  return (
    <InnerCarbonPortalContext.Provider value={container}>
      {children}
    </InnerCarbonPortalContext.Provider>
  )
}

