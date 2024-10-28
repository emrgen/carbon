import {
  createContext,
  RefObject,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { BoardOverlay } from "../components/BoardOverlay";

interface BoardOverlayContextProps {
  ref: RefObject<HTMLDivElement>;
  visible: boolean;
  setVisible: (visible: boolean) => void;
  showOverlay: () => void;
  hideOverlay: () => void;
}

export const InnerBoardOverlayContext = createContext<BoardOverlayContextProps>(
  {
    ref: null!,
    visible: false,
    setVisible: (visible: boolean) => {},
    showOverlay: () => {},
    hideOverlay: () => {},
  },
);

export const BoardOverlayProvider = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const ref = useRef<any>();
  const showOverlay = () => setVisible(true);
  const hideOverlay = () => setVisible(false);

  const value = useMemo(() => {
    return {
      ref,
      visible,
      setVisible,
      showOverlay,
      hideOverlay,
    };
  }, [visible]);

  return (
    <InnerBoardOverlayContext.Provider value={value}>
      {children}
      <BoardOverlay ref={ref} />
    </InnerBoardOverlayContext.Provider>
  );
};

export const useBoardOverlay = () => {
  return useContext(InnerBoardOverlayContext);
};