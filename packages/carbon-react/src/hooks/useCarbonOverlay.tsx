import { RefObject, createContext, useContext, useRef, useState } from "react";
import EventEmitter from "events";
import { Optional } from '@emrgen/types';
import {Node, preventAndStop} from "@emrgen/carbon-core";

const InnerCarbonOverlayContext = createContext<{
  ref: RefObject<HTMLDivElement>;
  node: Optional<Node>;
  setNode(node: Optional<Node>): void;
  overlay: EventEmitter;
  showOverlay(id?: string): void;
  hideOverlay(): void;
}>({} as any);

export const CarbonOverlayContext = ({ children }) => {
  const ref = useRef<HTMLDivElement>(null);
  const downRef = useRef<any>(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const [emitter] = useState(() => new EventEmitter());
  const [id, setId] = useState('');
  const [node, setNode] = useState<Optional<Node>>(null);

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
        data-target={node?.name ?? ''}
        data-id={id}
        ref={ref}
        style={{
          opacity: showOverlay ? 1 : 0,
          zIndex: showOverlay ? 100 : -100,
        }}
        onMouseDown={(e) => {
          downRef.current = e.target;
          preventAndStop(e);
        }}
        onClick={(e) => {
          preventAndStop(e);
          if (downRef.current !== e.target) return;
          downRef.current = null
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
