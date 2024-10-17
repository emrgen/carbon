import { createContext, useContext } from "react";
import { Carbon } from "@emrgen/carbon-core";
import { EventTrackerProvider } from "./useEventTracker";

const InnerCarbonContext = createContext<Carbon>(null!);

export const CarbonContext = ({ app, children }) => {
  return (
    <InnerCarbonContext.Provider value={app}>
      <EventTrackerProvider>
        <div className="carbon-app">{children}</div>
      </EventTrackerProvider>
    </InnerCarbonContext.Provider>
  );
};

export const useCarbon = () => {
  return useContext(InnerCarbonContext);
};
