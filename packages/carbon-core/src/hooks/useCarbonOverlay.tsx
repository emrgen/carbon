import { RefObject, createContext, useContext, useRef, useState } from "react";
import { preventAndStop } from "../utils/event";

const InnerCarbonOverlayContext = createContext<{
  ref: RefObject<HTMLDivElement>;
  showOverlay();
  hideOverlay();
}>({} as any);

export const CarbonOverlayContext = ({ children }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [showOverlay, setShowOverlay] = useState(true);

  return (
    <InnerCarbonOverlayContext.Provider
      value={{
        ref,
        showOverlay: () => setShowOverlay(true),
        hideOverlay: () => setShowOverlay(false),
      }}
    >
      {children}
      <div
        className="carbon-overlay"
        ref={ref}
        style={{
          opacity: showOverlay ? 1 : 0,
          zIndex: showOverlay ? 1000 : -100,
        }}
        onMouseDown={preventAndStop}
        onClick={preventAndStop}
      />
    </InnerCarbonOverlayContext.Provider>
  );
};

export const useCarbonOverlay = () => {
  return useContext(InnerCarbonOverlayContext);
};
