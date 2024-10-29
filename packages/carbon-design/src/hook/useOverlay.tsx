import { EventEmitter } from "events";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { BoardOverlay } from "../components/BoardOverlay";

interface BoardOverlayContextProps {
  showOverlay: () => void;
  hideOverlay: () => void;
}

export const InnerBoardOverlayContext = createContext<BoardOverlayContextProps>(
  {
    showOverlay: () => {},
    hideOverlay: () => {},
  },
);

export const BoardOverlayProvider = ({ children }) => {
  const [bus] = useState(() => new EventEmitter());
  const showOverlay = useCallback(() => {
    bus.emit("show");
  }, [bus]);

  const hideOverlay = useCallback(() => {
    bus.emit("hide");
  }, [bus]);

  const value = useMemo(() => {
    return {
      showOverlay,
      hideOverlay,
    };
  }, [hideOverlay, showOverlay]);

  return (
    <InnerBoardOverlayContext.Provider value={value}>
      {children}
      <BoardOverlay bus={bus} />
    </InnerBoardOverlayContext.Provider>
  );
};

export const useBoardOverlay = () => {
  return useContext(InnerBoardOverlayContext);
};