import { createContext, useContext } from "react";
import { Carbon } from "../core/Carbon";
import { CarbonOverlayContext } from "./useCarbonOverlay";

const InnerCarbonContext = createContext<Carbon>(null!);

export const CarbonContext = ({ app, children }) => {
  return (
    <InnerCarbonContext.Provider value={app}>
      <CarbonOverlayContext>
        <div className="carbon-app" >{children}</div>
      </CarbonOverlayContext>
    </InnerCarbonContext.Provider>
  );
};

export const useCarbon = () => {
  return useContext(InnerCarbonContext);
};
