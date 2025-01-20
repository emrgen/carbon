import { Node, preventAndStop } from "@emrgen/carbon-core";
import { Optional } from "@emrgen/types";
import { EventEmitter } from "events";
import {
  createContext,
  RefObject,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { usePrevious } from "react-use";

const InnerCarbonOverlayContext = createContext<{
  ref: RefObject<HTMLDivElement>;
  node: Optional<Node>;
  setNode(node: Optional<Node>): void;
  overlay: EventEmitter;
  showOverlay(id?: string): void;
  hideOverlay(): void;
  onClick?(e: any): void;
}>({} as any);

export const CarbonOverlayContext = ({ children }) => {
  const ref = useRef<HTMLDivElement>(null);
  const downRef = useRef<any>(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const [emitter] = useState(() => new EventEmitter());
  const [id, setId] = useState("");
  const [node, setNode] = useState<Optional<Node>>(null);
  const prevShowOverlay = usePrevious(showOverlay);

  useEffect(() => {
    if (showOverlay && !prevShowOverlay) {
      emitter.emit("show");
    } else if (!showOverlay && prevShowOverlay) {
      emitter.emit("hide");
    }
  }, [emitter, prevShowOverlay, showOverlay]);

  return (
    <InnerCarbonOverlayContext.Provider
      value={{
        ref,
        node,
        setNode,
        overlay: emitter,
        showOverlay: (id?: string) => {
          setId(id ?? "");
          setShowOverlay(true);
        },
        hideOverlay: () => {
          setId("");
          setShowOverlay(false);
        },
      }}
    >
      <div
        className="carbon-overlay"
        data-target={node?.name ?? ""}
        data-id={id}
        ref={ref}
        style={{
          // opacity: showOverlay ? 1 : 0,
          zIndex: showOverlay ? 100 : -100,
          // background: "rgba(0, 0, 0, 0.2)",
        }}
        onMouseMove={(e) => {
          e.preventDefault();
        }}
        onMouseDown={(e) => {
          downRef.current = e.target;
          preventAndStop(e);
        }}
        // hide overlay on click
        onClick={(e) => {
          // preventAndStop(e);
          // if the mouse down target is not the same as the mouse up target,
          // then it's not a click on the overlay
          if (downRef.current !== e.target) return;
          downRef.current = null;
          setShowOverlay(false);
          emitter.emit("click", e);
        }}
      ></div>
      {children}
    </InnerCarbonOverlayContext.Provider>
  );
};

export const useCarbonOverlay = () => {
  return useContext(InnerCarbonOverlayContext);
};
