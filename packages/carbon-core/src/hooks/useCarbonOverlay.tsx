import { RefObject, createContext, useContext, useRef, useState } from "react";
import { preventAndStop } from "../utils/event";
import EventEmitter from "events";

const InnerCarbonOverlayContext = createContext<{
  ref: RefObject<HTMLDivElement>;
  overlay: EventEmitter;
  showOverlay();
  hideOverlay();
}>({} as any);

export const CarbonOverlayContext = ({ children }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const [emitter] = useState(() => new EventEmitter());

  return (
    <InnerCarbonOverlayContext.Provider
      value={{
        ref,
        overlay: emitter,
        showOverlay: () => setShowOverlay(true),
        hideOverlay: () => setShowOverlay(false),
      }}
    >
      {showOverlay && (
        <div
          className="carbon-overlay"
          ref={ref}
          style={{
            opacity: showOverlay ? 1 : 0,
            zIndex: showOverlay ? 100 : -100,
          }}
          // onMouseDown={preventAndStop}
          onClick={(e) => {
            preventAndStop(e);
            setShowOverlay(false);
            emitter.emit("click", e);
          }}
        />
      )}
      {children}
    </InnerCarbonOverlayContext.Provider>
  );
};

export const useCarbonOverlay = () => {
  return useContext(InnerCarbonOverlayContext);
};
