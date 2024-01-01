import { createContext, useContext } from "react";
import {Carbon} from "@emrgen/carbon-core";

const InnerCarbonContext = createContext<Carbon>(null!);

export const CarbonContext = ({ app, children }) => {
  return (
    <InnerCarbonContext.Provider value={app}>
      <div className="carbon-app">{children}</div>
    </InnerCarbonContext.Provider>
  );
};

export const useCarbon = () => {
  return useContext(InnerCarbonContext);
};
