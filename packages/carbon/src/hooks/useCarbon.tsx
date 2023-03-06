import { createContext, useContext, useEffect, useState } from "react";
import { Carbon } from "../core/Carbon";

const InnerCarbonContext = createContext<Carbon>(null!);

export const CarbonContext = ({ app, children }) => {
  return (
    <div className="carbon-app">
      <InnerCarbonContext.Provider value={app}>
        {children}
      </InnerCarbonContext.Provider>
    </div>
  );
};

export const useCarbon = () => {
  return useContext(InnerCarbonContext);
};
